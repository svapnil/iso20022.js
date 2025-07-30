import { BalanceReport, MT941Tag } from '../types';
import { Currency } from 'dinero.js';
import {
  parseBalance,
  parseDateTimeIndication,
  parseEntriesSum,
  parseStatementNumber,
  validateCurrencyConsistency
} from './utils';
import {
  InvalidFormatError,
  InvalidCurrencyConsistencyError
} from '../../errors';

/**
 * Configuration interface for creating a BalanceReport instance.
 */
interface BalanceReportConfig extends BalanceReport {}

/**
 * Represents a Balance Report (MT 941).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from an MT 941 message.
 */
export class BalanceReportMessage {
  private _transactionReferenceNumber: string;
  private _relatedReference?: string;
  private _accountIdentification: string;
  private _statementNumber: string;
  private _dateTimeIndication?: Date;
  private _openingBalance?: {
    creditDebitIndicator: 'C' | 'D';
    date: Date;
    currency: Currency;
    amount: number;
  };
  private _debitEntries?: {
    count: number;
    currency: Currency;
    amount: number;
  };
  private _creditEntries?: {
    count: number;
    currency: Currency;
    amount: number;
  };
  private _bookBalance: {
    creditDebitIndicator: 'C' | 'D';
    date: Date;
    currency: Currency;
    amount: number;
  };
  private _closingAvailableBalance?: {
    creditDebitIndicator: 'C' | 'D';
    date: Date;
    currency: Currency;
    amount: number;
  };
  private _forwardAvailableBalance?: {
    creditDebitIndicator: 'C' | 'D';
    date: Date;
    currency: Currency;
    amount: number;
  };
  private _informationToAccountOwner?: string;

  constructor(config: BalanceReportConfig) {
    this._transactionReferenceNumber = config.transactionReferenceNumber;
    this._relatedReference = config.relatedReference;
    this._accountIdentification = config.accountIdentification;
    this._statementNumber = config.statementNumber;
    this._dateTimeIndication = config.dateTimeIndication;
    this._openingBalance = config.openingBalance;
    this._debitEntries = config.debitEntries;
    this._creditEntries = config.creditEntries;
    this._bookBalance = config.bookBalance;
    this._closingAvailableBalance = config.closingAvailableBalance;
    this._forwardAvailableBalance = config.forwardAvailableBalance;
    this._informationToAccountOwner = config.informationToAccountOwner;
  }

  /**
   * Creates a BalanceReportMessage instance from a raw MT 941 string.
   *
   * @param {string} rawMT941 - The raw MT 941 string.
   * @returns {BalanceReportMessage} A new instance of BalanceReportMessage.
   * @throws {Error} If the parsing fails or required data is missing.
   */
  static fromMT941(rawMT941: string): BalanceReportMessage {
    // Parse the MT 941 message into fields
    const fields = BalanceReportMessage.parseFields(rawMT941);

    // Validate required fields
    if (!fields.has(MT941Tag.TransactionReferenceNumber)) {
      throw new InvalidFormatError('Missing required field: Transaction Reference Number (20)');
    }
    if (!fields.has(MT941Tag.AccountIdentification)) {
      throw new InvalidFormatError('Missing required field: Account Identification (25)');
    }
    if (!fields.has(MT941Tag.StatementNumber)) {
      throw new InvalidFormatError('Missing required field: Statement Number (28)');
    }
    if (!fields.has(MT941Tag.BookBalance)) {
      throw new InvalidFormatError('Missing required field: Book Balance (62F)');
    }

    // Extract field values
    const transactionReferenceNumber = fields.get(MT941Tag.TransactionReferenceNumber)!;
    const relatedReference = fields.get(MT941Tag.RelatedReference);
    const accountIdentification = fields.get(MT941Tag.AccountIdentification)!;
    const statementNumber = parseStatementNumber(fields.get(MT941Tag.StatementNumber)!);

    // Parse optional date/time indication
    const dateTimeIndication = fields.has(MT941Tag.DateTimeIndication)
      ? parseDateTimeIndication(fields.get(MT941Tag.DateTimeIndication)!)
      : undefined;

    // Parse balances
    const openingBalance = fields.has(MT941Tag.OpeningBalance)
      ? parseBalance(fields.get(MT941Tag.OpeningBalance)!)
      : undefined;

    const debitEntries = fields.has(MT941Tag.DebitEntries)
      ? parseEntriesSum(fields.get(MT941Tag.DebitEntries)!)
      : undefined;

    const creditEntries = fields.has(MT941Tag.CreditEntries)
      ? parseEntriesSum(fields.get(MT941Tag.CreditEntries)!)
      : undefined;

    const bookBalance = parseBalance(fields.get(MT941Tag.BookBalance)!);

    const closingAvailableBalance = fields.has(MT941Tag.ClosingAvailableBalance)
      ? parseBalance(fields.get(MT941Tag.ClosingAvailableBalance)!)
      : undefined;

    const forwardAvailableBalance = fields.has(MT941Tag.ForwardAvailableBalance)
      ? parseBalance(fields.get(MT941Tag.ForwardAvailableBalance)!)
      : undefined;

    const informationToAccountOwner = fields.get(MT941Tag.InformationToAccountOwner);

    // Validate currency consistency (Network Validated Rule C1)
    const currencies: Currency[] = [];
    if (openingBalance) currencies.push(openingBalance.currency);
    if (debitEntries) currencies.push(debitEntries.currency);
    if (creditEntries) currencies.push(creditEntries.currency);
    currencies.push(bookBalance.currency);
    if (closingAvailableBalance) currencies.push(closingAvailableBalance.currency);
    if (forwardAvailableBalance) currencies.push(forwardAvailableBalance.currency);

    if (!validateCurrencyConsistency(currencies)) {
      throw new InvalidCurrencyConsistencyError(
        'Currency codes in fields 60F, 90D, 90C, 62F, 64, and 65 must have the same first two characters'
      );
    }

    return new BalanceReportMessage({
      transactionReferenceNumber,
      relatedReference,
      accountIdentification,
      statementNumber,
      dateTimeIndication,
      openingBalance,
      debitEntries,
      creditEntries,
      bookBalance,
      closingAvailableBalance,
      forwardAvailableBalance,
      informationToAccountOwner
    });
  }

  /**
   * Parses the raw MT 941 string into a map of field tags to field values.
   *
   * @param {string} rawMT941 - The raw MT 941 string.
   * @returns {Map<string, string>} A map of field tags to field values.
   */
  private static parseFields(rawMT941: string): Map<string, string> {
    const fields = new Map<string, string>();

    // Split the message into lines
    const lines = rawMT941.split(/\r?\n/);

    let currentTag: string | null = null;
    let currentValue = '';

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;

      // Check if this line starts a new field
      // Handle both formats: ":20:" and "::20:"
      const tagMatch = line.match(/^:+(\d{2}[A-Z]?):/);

      if (tagMatch) {
        // If we were processing a field, save it
        if (currentTag) {
          fields.set(currentTag, currentValue.trim());
        }

        // Start a new field
        currentTag = tagMatch[1];
        currentValue = line.substring(line.indexOf(':', line.indexOf(':') + 1) + 1);
      } else if (currentTag) {
        // Continue with the current field
        currentValue += '\n' + line;
      }
    }

    // Save the last field
    if (currentTag) {
      fields.set(currentTag, currentValue.trim());
    }

    return fields;
  }

  /**
   * Gets the transaction reference number.
   * @returns {string} The transaction reference number.
   */
  get transactionReferenceNumber(): string {
    return this._transactionReferenceNumber;
  }

  /**
   * Gets the related reference.
   * @returns {string | undefined} The related reference, or undefined if not set.
   */
  get relatedReference(): string | undefined {
    return this._relatedReference;
  }

  /**
   * Gets the account identification.
   * @returns {string} The account identification.
   */
  get accountIdentification(): string {
    return this._accountIdentification;
  }

  /**
   * Gets the statement number.
   * @returns {string} The statement number.
   */
  get statementNumber(): string {
    return this._statementNumber;
  }

  /**
   * Gets the date/time indication.
   * @returns {Date | undefined} The date/time indication, or undefined if not set.
   */
  get dateTimeIndication(): Date | undefined {
    return this._dateTimeIndication;
  }

  /**
   * Gets the opening balance.
   * @returns {object | undefined} The opening balance, or undefined if not set.
   */
  get openingBalance() {
    return this._openingBalance;
  }

  /**
   * Gets the debit entries.
   * @returns {object | undefined} The debit entries, or undefined if not set.
   */
  get debitEntries() {
    return this._debitEntries;
  }

  /**
   * Gets the credit entries.
   * @returns {object | undefined} The credit entries, or undefined if not set.
   */
  get creditEntries() {
    return this._creditEntries;
  }

  /**
   * Gets the book balance.
   * @returns {object} The book balance.
   */
  get bookBalance() {
    return this._bookBalance;
  }

  /**
   * Gets the closing available balance.
   * @returns {object | undefined} The closing available balance, or undefined if not set.
   */
  get closingAvailableBalance() {
    return this._closingAvailableBalance;
  }

  /**
   * Gets the forward available balance.
   * @returns {object | undefined} The forward available balance, or undefined if not set.
   */
  get forwardAvailableBalance() {
    return this._forwardAvailableBalance;
  }

  /**
   * Gets the information to account owner.
   * @returns {string | undefined} The information to account owner, or undefined if not set.
   */
  get informationToAccountOwner(): string | undefined {
    return this._informationToAccountOwner;
  }
}
