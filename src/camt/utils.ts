import {
  Balance,
  BalanceInReport,
  BankTransactionCode,
  BusinessError,
  Entry,
  Statement,
  Transaction,
} from 'camt/types';
import { Party } from '../lib/types';
import { exportAccount, exportAgent, exportAmountToString, parseAdditionalInformation, parseDate } from '../parseUtils';
import {
  parseAccount,
  parseAgent,
  parseAmountToMinorUnits,
} from '../parseUtils';
import { Currency } from 'dinero.js';

export const parseStatement = (stmt: any): Statement => {
  const id = stmt.Id.toString();
  const electronicSequenceNumber = stmt.ElctrncSeqNb;
  const legalSequenceNumber = stmt.LglSeqNb;
  const creationDate = new Date(stmt.CreDtTm);

  let fromDate;
  let toDate;
  if (stmt.FrToDt) {
    fromDate = new Date(stmt.FrToDt.FrDtTm);
    toDate = new Date(stmt.FrToDt.ToDtTm);
  }

  // Txn Summaries
  const numOfEntries = stmt.TxsSummry?.TtlNtries.NbOfNtries;
  const sumOfEntries = stmt.TxsSummry?.TtlNtries.Sum;
  const rawNetAmountOfEntries = stmt.TxsSummry?.TtlNtries.TtlNetNtryAmt;
  let netAmountOfEntries;
  // No currency information, default to USD
  if (rawNetAmountOfEntries) {
    netAmountOfEntries = parseAmountToMinorUnits(rawNetAmountOfEntries);
  }

  const numOfCreditEntries = stmt.TxsSummry?.TtlCdtNtries.NbOfNtries;
  const sumOfCreditEntries = stmt.TxsSummry?.TtlCdtNtries.Sum;

  const numOfDebitEntries = stmt.TxsSummry?.TtlDbtNtries.NbOfNtries;
  const sumOfDebitEntries = stmt.TxsSummry?.TtlDbtNtries.Sum;

  // Get account information
  // TODO: Save account types here
  const account = parseAccount(stmt.Acct);

  const agent = parseAgent(stmt.Acct.Svcr);

  let balances: Balance[] = [];
  if (Array.isArray(stmt.Bal)) {
    balances = stmt.Bal.map(parseBalance);
  } else if (stmt.Bal) {
    balances = [parseBalance(stmt.Bal)];
  }

  let entries: Entry[] = [];
  if (Array.isArray(stmt.Ntry)) {
    entries = stmt.Ntry.map(parseEntry);
  } else if (stmt.Ntry) {
    entries = [parseEntry(stmt.Ntry)];
  }

  return {
    id,
    electronicSequenceNumber,
    legalSequenceNumber,
    creationDate,
    fromDate,
    toDate,
    account,
    agent,
    numOfEntries,
    sumOfEntries,
    netAmountOfEntries,
    numOfCreditEntries,
    sumOfCreditEntries,
    numOfDebitEntries,
    sumOfDebitEntries,
    balances,
    entries,
  };
};

export const exportStatement = (stmt: Statement): any => {
  const obj = {
    Id: stmt.id,
    ElctrncSeqNb: stmt.electronicSequenceNumber,
    LglSeqNb: stmt.legalSequenceNumber,
    CreDtTm: stmt.creationDate.toISOString(),
    FrToDt:
      stmt.fromDate && stmt.toDate
        ? {
            FrDtTm: stmt.fromDate.toISOString().slice(0, 10),
            ToDtTm: stmt.toDate.toISOString().slice(0, 10),
          }
        : undefined,
    TxsSummry: {
      TtlNtries: {
        NbOfNtries: stmt.numOfEntries,
        Sum: stmt.sumOfEntries,
        TtlNetNtryAmt: stmt.netAmountOfEntries
          ? exportAmountToString(stmt.netAmountOfEntries, stmt.balances[0]?.currency)
          : undefined,
      },
      TtlCdtNtries: {
        NbOfNtries: stmt.numOfCreditEntries,
        Sum: stmt.sumOfCreditEntries,
      },
      TtlDbtNtries: {
        NbOfNtries: stmt.numOfDebitEntries,
        Sum: stmt.sumOfDebitEntries,
      },
    },
    Acct: {
      ...exportAccount(stmt.account), 
      Svcr: exportAgent(stmt.agent)
    },
    Bal: stmt.balances.map((bal) => exportBalance(bal)),
    Ntry: stmt.entries.map((entry) => exportEntry(entry)),
  }
  return obj;
}

export const parseBalance = (balance: any): Balance => {
  const rawAmount = balance.Amt['#text'];
  const currency = balance.Amt['@_Ccy'];
  const amount = parseAmountToMinorUnits(rawAmount, currency);
  const creditDebitIndicator =
    balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const type = balance.Tp.CdOrPrtry.Cd;
  const date = parseDate(balance.Dt);
  return {
    date,
    amount,
    currency,
    creditDebitIndicator,
    type,
  } as Balance;
};

export const exportBalance = (balance: Balance): any => {
  const obj: any = {
    Amt: {
      '#text': exportAmountToString(balance.amount, balance.currency),
      '@_Ccy': balance.currency,
    },
    CdtDbtInd: balance.creditDebitIndicator === 'credit' ? 'CRDT' : 'DBIT',
    Tp: {
      CdOrPrtry: {
        Cd: balance.type,
      },
    },
    Dt: {
      DtTm: balance.date.toISOString(),
    },
  };

  return obj;
}

export const parseBalanceReport = (currency: Currency, balance: any): BalanceInReport => {
  const rawAmount = balance.Amt;
  const amount = parseAmountToMinorUnits(rawAmount, currency);
  const creditDebitIndicator =
    balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const type = balance.Tp?.Cd || balance.Tp?.Prtry;
  const valueDate = parseDate(balance.ValDt?.Dt);
  const processingDate = parseDate(balance.PrcgDt?.DtTm);
  return {
    amount,
    creditDebitIndicator,
    type,
    valueDate,
    processingDate,
  };
};

export const exportBalanceReport = (currency: Currency, balance: BalanceInReport): any => {
  const obj: any = {
    Amt: exportAmountToString(balance.amount, currency),
    CdtDbtInd: balance.creditDebitIndicator === 'credit' ? 'CRDT' : 'DBIT',
    Tp: {
      Cd: balance.type, // TODO add Prtry handling
    },
    ValDt: {
      Dt: balance.valueDate?.toISOString().slice(0, 10),
    },
    PrcgDt: {
      DtTm: balance.processingDate?.toISOString(),
    },
  };

  return obj;
}

export const parseEntry = (entry: any): Entry => {
  const referenceId = entry.NtryRef;
  const creditDebitIndicator = entry.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const bookingDate = parseDate(entry.BookgDt);
  const reversal = entry.RvslInd === true;
  const rawAmount = entry.Amt['#text'];
  const currency = entry.Amt['@_Ccy'];
  const amount = parseAmountToMinorUnits(rawAmount, currency);
  const proprietaryCode = entry.BkTxCd.Prtry?.Cd;
  const additionalInformation = parseAdditionalInformation(entry.AddtlNtryInf);
  const accountServicerReferenceId = entry.AcctSvcrRef;
  const bankTransactionCode = parseBankTransactionCode(entry.BkTxCd);

  // Currently, we flatten entry details into a list of TransactionDetails
  let rawEntryDetails = entry.NtryDtls || [];
  if (!Array.isArray(rawEntryDetails)) {
    rawEntryDetails = [rawEntryDetails];
  }

  const transactions = rawEntryDetails
    .map((rawDetail: any) => {
      // Get list of transaction details, even if it's singleton
      let transactionDetails = rawDetail.TxDtls || [];
      if (!Array.isArray(transactionDetails)) {
        transactionDetails = [transactionDetails];
      }
      return transactionDetails.map(parseTransactionDetail);
    })
    .flat();

  return {
    referenceId,
    creditDebitIndicator,
    bookingDate,
    reversal,
    amount,
    currency,
    proprietaryCode,
    transactions,
    additionalInformation,
    accountServicerReferenceId,
    bankTransactionCode,
  } as Entry;
};

export const exportEntry = (entry: Entry): any => {
  const obj: any = {
    NtryRef: entry.referenceId,
    CdtDbtInd: entry.creditDebitIndicator === 'credit' ? 'CRDT' : 'DBIT',
    BookgDt: {
      DtTm: entry.bookingDate.toISOString(),
    },
    RvslInd: entry.reversal,
    Amt: {
      '#text': exportAmountToString(entry.amount, entry.currency),
      '@_Ccy': entry.currency,
    },
    BkTxCd: exportBankTransactionCode(entry.bankTransactionCode, entry.proprietaryCode),
    AddtlNtryInf: entry.additionalInformation,
    AcctSvcrRef: entry.accountServicerReferenceId,
    NtryDtls: entry.transactions.map((tx) => ({TxDtls: exportTransactionDetails(tx)}))
  }
  return obj;
}

const parseTransactionDetail = (transactionDetail: any): Transaction => {
  const messageId = transactionDetail.Refs?.MsgId;
  const accountServicerReferenceId = transactionDetail.Refs?.AcctSvcrRef;
  const paymentInformationId = transactionDetail.Refs?.PmtInfId;
  const remittanceInformation = transactionDetail.RmtInf?.Ustrd;
  const proprietaryPurpose = transactionDetail.Purp?.Prtry;
  const returnReason = transactionDetail.RtrInf?.Rsn;
  const returnAdditionalInformation = transactionDetail.RtrInf?.AddtlInf;
  const endToEndId = transactionDetail.Refs?.EndToEndId;

  // Get Debtor information if 'Dbtr' is present
  let debtor;
  let debtorName;
  let debtorAccount;
  let debtorAgent;
  if (transactionDetail.RltdPties?.Dbtr) {
    debtorName = transactionDetail.RltdPties.Dbtr.Nm;
  }
  if (transactionDetail.RltdPties?.DbtrAcct) {
    debtorAccount = parseAccount(transactionDetail.RltdPties.DbtrAcct);
  }
  if (transactionDetail.RltdAgts?.DbtrAgt) {
    debtorAgent = parseAgent(transactionDetail.RltdAgts.DbtrAgt);
  }

  if (debtorName || debtorAccount || debtorAgent) {
    debtor = {
      name: debtorName,
      account: debtorAccount,
      agent: debtorAgent,
    } as Party;
  }

  // Get Creditor information if 'Cdtr' is presentt
  let creditor;
  let creditorName;
  let creditorAccount;
  let creditorAgent;
  if (transactionDetail.RltdPties?.Cdtr) {
    creditorName = transactionDetail.RltdPties.Cdtr.Nm;
  }
  if (transactionDetail.RltdPties?.CdtrAcct) {
    creditorAccount = parseAccount(transactionDetail.RltdPties.CdtrAcct);
  }
  if (transactionDetail.RltdAgts?.CdtrAgt) {
    creditorAgent = parseAgent(transactionDetail.RltdAgts.CdtrAgt);
  }

  if (creditorName || creditorAccount || creditorAgent) {
    creditor = {
      name: creditorName,
      account: creditorAccount,
      agent: creditorAgent,
    } as Party;
  }

  return {
    messageId,
    accountServicerReferenceId,
    endToEndId,
    paymentInformationId,
    remittanceInformation,
    proprietaryPurpose,
    returnReason,
    returnAdditionalInformation,
    debtor,
    creditor,
  } as Transaction;
};

const exportTransactionDetails = (tx: Transaction): any => {
  const obj: any = {
    Refs: {
      MsgId: tx.messageId,
      AcctSvcrRef: tx.accountServicerReferenceId,
      PmtInfId: tx.paymentInformationId,
      EndToEndId: tx.endToEndId,
    },
    RmtInf: {
      Ustrd: tx.remittanceInformation,
    },
    Purp: {
      Prtry: tx.proprietaryPurpose,
    },
    RtrInf: {
      Rsn: tx.returnReason,
      AddtlInf: tx.returnAdditionalInformation,
    },
  };
  if (tx.debtor) {
    obj.RltdPties = {
      ...obj.RltdPties,
      Dbtr: {
        Nm: tx.debtor.name,
      },
      DbtrAcct: tx.debtor.account ? exportAccount(tx.debtor.account) : undefined,
    };
    obj.RltdAgts = {
      DbtrAgt: tx.debtor.agent ? exportAgent(tx.debtor.agent) : undefined,
    };
  }
  if (tx.creditor) {
    obj.RltdPties = {
      ...obj.RltdPties,
      Cdtr: {
        Nm: tx.creditor.name,
      },
      CdtrAcct: tx.creditor.account ? exportAccount(tx.creditor.account) : undefined,
    };
    obj.RltdAgts = {
      CdtrAgt: tx.creditor.agent ? exportAgent(tx.creditor.agent) : undefined,
    };
  }
  return obj;
}

const parseBankTransactionCode = (
  transactionCode: any,
): BankTransactionCode | undefined => {
  const domainCode = transactionCode?.Domn?.Cd;
  const domainFamilyCode = transactionCode?.Domn?.Fmly?.Cd;
  const domainSubFamilyCode = transactionCode?.Domn?.Fmly?.SubFmlyCd;
  const proprietaryCode = transactionCode.Prtry?.Cd;
  const proprietaryCodeIssuer = transactionCode.Prtry?.Issr;

  return {
    domainCode,
    domainFamilyCode,
    domainSubFamilyCode,
    proprietaryCode,
    proprietaryCodeIssuer,
  };
};

const exportBankTransactionCode = (
  bankTransactionCode: BankTransactionCode | undefined,
  proprietaryCode?: string,
): any => {
  const obj: any = {
  }
  if (proprietaryCode) {
    obj.Prtry = { Cd: proprietaryCode };
  }
  if (bankTransactionCode) {
    obj.Domn = {
      Cd: bankTransactionCode.domainCode,
      Fmly: {
        Cd: bankTransactionCode.domainFamilyCode,
        SubFmlyCd: bankTransactionCode.domainSubFamilyCode,
      },
    };
    if (bankTransactionCode.proprietaryCode) {
      obj.Prtry = {
        Cd: bankTransactionCode.proprietaryCode,
        Issr: bankTransactionCode.proprietaryCodeIssuer,
      };
    }
  }
  return obj;
}

export const parseBusinessError = (bizErr: any): BusinessError => {
  const code = bizErr.Err?.Cd || bizErr.Err?.Prtry || "UKNW";
  const description = bizErr.Desc;
  return {
    code,
    description,
  };
}

export const exportBusinessError = (bizErr: BusinessError): any => {
  const obj: any = {
    Err: {
      Cd: bizErr.code, // TODO: Add Prtry handling
    },
    Desc: bizErr.description,
  };
  return obj;
}