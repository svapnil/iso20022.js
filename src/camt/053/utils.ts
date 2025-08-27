import {
  Balance,
  BankTransactionCode,
  Entry,
  Statement,
  Transaction
} from 'camt/types';
import { Party } from '../../lib/types';
import { parseAdditionalInformation, parseDate } from '../../parseUtils';
import {
  parseAccount,
  parseAgent,

} from '../../parseUtils';

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
  const numOfEntries = stmt.TxsSummry?.TtlNtries?.NbOfNtries;
  const sumOfEntries = stmt.TxsSummry?.TtlNtries?.Sum;
  const netAmountOfEntries = stmt.TxsSummry?.TtlNtries?.TtlNetNtryAmt;

  const numOfCredits = stmt.TxsSummry?.TtlCdtNtries?.NbOfNtries;
  const sumOfCredits = stmt.TxsSummry?.TtlCdtNtries?.Sum;

  const numOfDebits = stmt.TxsSummry?.TtlDbtNtries?.NbOfNtries;
  const sumOfDebits = stmt.TxsSummry?.TtlDbtNtries?.Sum;

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
    numOfCredits,
    sumOfCredits,
    numOfDebits,
    sumOfDebits,
    balances,
    entries,
  } as Statement;
};

export const parseBalance = (balance: any): Balance => {
  const amount = balance.Amt['#text'];
  const currency = balance.Amt['@_Ccy'];
  const creditDebitIndicator =
    balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const type = balance.Tp.CdOrPrtry.Cd;
  const proprietary = String(balance.Tp.CdOrPrtry.Prtry);
  const date = parseDate(balance.Dt);
  return {
    date,
    amount,
    currency,
    creditDebitIndicator,
    type,
    proprietary,
  } as Balance;
};

export const parseEntry = (entry: any): Entry => {
  const referenceId = entry.NtryRef;
  const creditDebitIndicator = entry.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const bookingDate = parseDate(entry.BookgDt);
  const valueDate = parseDate(entry.ValDt);
  const reversal = entry.RvslInd === true;
  const amount = entry.Amt['#text'];
  const currency = entry.Amt['@_Ccy'];
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
    valueDate,
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

const parseTransactionDetail = (transactionDetail: any): Transaction => {
  const messageId = transactionDetail.Refs?.MsgId;
  const transactionId = transactionDetail.Refs?.TxId;
  const transactionDate = transactionDetail.RltdDts?.TxDtTm;
  const accountServicerReferenceId = transactionDetail.Refs?.AcctSvcrRef;
  const paymentInformationId = transactionDetail.Refs?.PmtInfId;
  const remittanceInformation = transactionDetail.RmtInf?.Ustrd;
  const proprietaryPurpose = transactionDetail.Purp?.Prtry;
  const returnReason = transactionDetail.RtrInf?.Rsn;
  const returnAdditionalInformation = transactionDetail.RtrInf?.AddtlInf;
  const endToEndId = transactionDetail.Refs?.EndToEndId;

  // Get Amount Details if 'AmtDtls' is present
  let instructedAmount;
  let instructedCurrency;
  let transactionAmount;
  let transactionCurrency;
  if (transactionDetail.AmtDtls) {
      instructedAmount = transactionDetail.AmtDtls.InstdAmt?.Amt['#text'];
      instructedCurrency = transactionDetail.AmtDtls.InstdAmt?.Amt['@_Ccy']
      transactionAmount = transactionDetail.AmtDtls.TxAmt?.Amt['#text'];
      transactionCurrency = transactionDetail.AmtDtls.TxAmt?.Amt['@_Ccy'];
  } else if (transactionDetail.Amt) {
    transactionAmount = transactionDetail.Amt['#text'];
    transactionCurrency = transactionDetail.Amt['@_Ccy'];
  }

  // Get Debtor information if 'Dbtr' is present
  let debtor;
  let debtorName;
  let debtorAccount;
  let debtorAgent;
  if (transactionDetail.RltdPties?.Dbtr) {
    debtorName = transactionDetail.RltdPties.Dbtr.Nm || transactionDetail.RltdPties.Dbtr.Pty?.Nm;
  } else if (transactionDetail.RltdPties?.UltmtDbtr) {
    debtorName = transactionDetail.RltdPties.UltmtDbtr.Nm || transactionDetail.RltdPties.UltmtDbtr.Pty?.Nm;
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
    creditorName = transactionDetail.RltdPties.Cdtr.Nm || transactionDetail.RltdPties.Cdtr.Pty?.Nm;
  } else if (transactionDetail.RltdPties?.UltmtCdtr) {
    creditorName = transactionDetail.RltdPties.UltmtCdtr.Nm || transactionDetail.RltdPties.UltmtCdtr.Pty?.Nm;
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
    transactionId,
    accountServicerReferenceId,
    endToEndId,
    paymentInformationId,
    remittanceInformation,
    proprietaryPurpose,
    returnReason,
    returnAdditionalInformation,
    debtor,
    creditor,
    instructedAmount,
    instructedCurrency,
    transactionAmount,
    transactionCurrency,
    transactionDate,
  } as Transaction;
};

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
