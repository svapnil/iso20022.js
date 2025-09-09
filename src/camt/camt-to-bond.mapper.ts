import { Balance, Statement } from './types';
import { validateWithSummary } from '../lib/validator/validator';
import {
  accountSchema,
  AccountSchema,
  AccountSchemaWithTransactions,
} from '../schemas/bond-banking/account.schema';
import { IBANAccount, LocalAccount } from '../lib/types';
import { CurrencyEnum } from '../lib/enums/currency.enum';
import { IMapper } from '../lib/mapper.interface';
import {
  TransactionSchema,
  transactionsSchema,
} from '../schemas/bond-banking/transaction.schema';
import { CashManagementEndOfDayReport } from './053/cash-management-end-of-day-report';

export class CamtToBondMapper implements IMapper<string> {
  CAMT_OPENING_BALANCE_TYPES = ['OPAV', '040', '40', 'OPBD'];
  CAMT_CLOSING_BALANCE_TYPES = ['CLAV', '015', '15', '901', 'CLBD'];
  private extractAccountIdentifier(camtStatement: Statement): {
    accountIdentifier: string;
    currency?: string;
  } {
    return {
      accountIdentifier:
        (camtStatement.account as LocalAccount).accountNumber ||
        (camtStatement.account as IBANAccount).iban,
      currency: camtStatement.account.currency,
    };
  }
  private extractBalancesFromCamtStatement(camtStatement: Statement): {
    openingBalance: Balance;
    closingBalance: Balance;
  } {
    const openingBalance = camtStatement.balances.find(
      balance =>
        this.CAMT_OPENING_BALANCE_TYPES.includes(balance.type) ||
        this.CAMT_OPENING_BALANCE_TYPES.includes(balance.proprietary),
    );

    if (openingBalance === undefined) {
      throw new Error('Opening balance not found in CAMT statement');
    }

    const closingBalance = camtStatement.balances.find(
      balance =>
        this.CAMT_CLOSING_BALANCE_TYPES.includes(balance.type) ||
        this.CAMT_CLOSING_BALANCE_TYPES.includes(balance.proprietary),
    );

    if (closingBalance === undefined) {
      throw new Error('Closing balance not found in CAMT statement');
    }

    return { openingBalance, closingBalance };
  }

  /**
   * Parse the input and return an account schema.
   * @param input - rawXml string
   * @returns AccountSchemaWithTransactions[]
   */
  parse(input: string): AccountSchemaWithTransactions[] {
    const { statements } = CashManagementEndOfDayReport.fromXML(input);

    const accounts = statements.map(statement => {
      const account = this.parseAccount(statement);
      const transactions = this._parseTransactions(statement, account);
      return {
        ...account,
        transactions,
      };
    });

    return accounts;
  }

  /**
   * Parse the input and return an account schema.
   * @param input - rawXml string
   * @returns AccountSchema[]
   */
  parseAccounts(input: string): AccountSchema[] {
    const statement = CashManagementEndOfDayReport.fromXML(input);
    return statement.statements.map(statement => this.parseAccount(statement));
  }

  parseAccount(input: Statement): AccountSchema {
    const accountIdentifier = this.extractAccountIdentifier(input);
    const balances = this.extractBalancesFromCamtStatement(input);

    const account: AccountSchema = {
      accountIdentifier: accountIdentifier.accountIdentifier,
      currency: accountIdentifier.currency as CurrencyEnum,
      openingBalance: {
        amount: balances.openingBalance.amount.toString(),
        date: balances.openingBalance.date,
      },
      closingBalance: {
        amount: balances.closingBalance.amount.toString(),
        date: balances.closingBalance.date,
      },
    };

    const result = validateWithSummary<typeof accountSchema, AccountSchema>(
      accountSchema,
      account,
    );

    return result.data;
  }

  parseTransactions(input: string): TransactionSchema[] {
    const statement = CashManagementEndOfDayReport.fromXML(input);
    return statement.statements.flatMap(statement =>
      this._parseTransactions(statement),
    );
  }

  _parseTransactions(input: Statement, account?: AccountSchema): TransactionSchema[] {
    const transactions: TransactionSchema[] = [];
    const { openingBalance } = this.extractBalancesFromCamtStatement(input);
    for (const entry of input.entries) {
      // Initialize runningBalance based on the opening balance
      let runningBalance = openingBalance.amount;

      for (const transaction of entry.transactions) {
        let creditorAccountIdentifier;
        let creditorName;
        let creditorMetadata;
        let debtorAccountIdentifier;
        let debtorName;
        let debtorMetadata;
        if (transaction.creditor) {
            if ((transaction.creditor?.account as IBANAccount)?.iban) {
                creditorAccountIdentifier = (transaction.creditor?.account as IBANAccount).iban.toString();
                creditorName = transaction.creditor?.name;
                creditorMetadata = {
                   ...transaction.creditor
                }
            } else {
                creditorAccountIdentifier = (transaction.creditor?.account as LocalAccount)?.accountNumber?.toString();
                creditorName = transaction.creditor?.name;
                creditorMetadata = {
                   ...transaction.creditor
                }
            }
        }
        if (transaction.debtor) {
            if ((transaction.debtor?.account as IBANAccount)?.iban) {
                debtorAccountIdentifier = (transaction.debtor?.account as IBANAccount).iban.toString();
                debtorName = transaction.debtor?.name;
                debtorMetadata = {
                    ...transaction.debtor
                }
            } else {
                debtorAccountIdentifier = (transaction.debtor?.account as LocalAccount)?.accountNumber?.toString();
                debtorName = transaction.debtor?.name;
                debtorMetadata = {
                    ...transaction.debtor
                }
            }
        }
        const transactionAmount = transaction.transactionAmount!;
        runningBalance += transactionAmount;

        // Extract date for the synthetic reference
        const transactionDate = transaction.transactionDate || entry.bookingDate || entry.valueDate;
        
        // Format date as YYYYMMDD for the synthetic reference
        const formattedDate = transactionDate.toISOString().slice(0, 10).replace(/-/g, '');
        
        // Try to get a reference from the original sources
        const originalReference = transaction.endToEndId || 
                                 transaction.transactionId || 
                                 entry.referenceId;
        
        // Generate a synthetic reference if no original reference exists
        const reference = originalReference 
          ? originalReference.toString()
          : `SYN_${account?.accountIdentifier.substring(0, 10)}_${formattedDate}_${transactionAmount.toString().replace(/[.-]/g, '')}`;

        const beneficiaryAccountIdentifier = creditorAccountIdentifier || debtorAccountIdentifier || creditorName || debtorName;
        
        transactions.push({
          amount: transactionAmount?.toString() || entry.amount?.toString(),
          currency: transaction.transactionCurrency as CurrencyEnum || entry.currency,
          type:
            entry.bankTransactionCode?.domainCode ||
            entry.bankTransactionCode?.proprietaryCode ||
            entry.bankTransactionCode?.domainFamilyCode ||
            entry.bankTransactionCode?.domainSubFamilyCode ||
            entry.bankTransactionCode?.proprietaryCodeIssuer!,
          endingBalance: runningBalance.toString(),
          date: transactionDate,
          reference: reference,
          description: transaction.paymentInformationId ? `Payment Info ${transaction.paymentInformationId}` : transaction.remittanceInformation,
          providerId: transaction.endToEndId?.toString(),
          beneficiary: beneficiaryAccountIdentifier ? {
            accountIdentifier: beneficiaryAccountIdentifier,
            metadata: creditorMetadata || debtorMetadata as any,
          } : undefined,
          
        });
      }
    }
    const result = validateWithSummary<
      typeof transactionsSchema,
      TransactionSchema[]
    >(transactionsSchema, transactions);
    return result.data;
  }
}
