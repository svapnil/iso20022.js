import { Statement } from "camt/types";
import { Account, BICAgent } from "../../lib/types";

export const parseStatement = (stmt: any): Statement => {
  const id = stmt.Id.toString();
  const electronicSequenceNumber = stmt.ElctrncSeqNb;
  const legalSequenceNumber = stmt.LglSeqNb;
  const creationDate = new Date(stmt.CreDtTm);
  const fromDate = new Date(stmt.FrToDt.FrDtTm);
  const toDate = new Date(stmt.FrToDt.ToDtTm);

  // Txn Summaries
  const numOfEntries = stmt.TxsSummry.TtlNtries.NbOfNtries;
  const sumOfEntries = stmt.TxsSummry.TtlNtries.Sum;
  const netAmountOfEntries = stmt.TxsSummry.TtlNtries.TtlNetNtryAmt;

  const numOfCredits = stmt.TxsSummry.TtlCdtNtries.NbOfNtries;
  const sumOfCredits = stmt.TxsSummry.TtlCdtNtries.Sum;

  const numOfDebits = stmt.TxsSummry.TtlDbtNtries.NbOfNtries;
  const sumOfDebits = stmt.TxsSummry.TtlDbtNtries.Sum;

  // Get account information
  // TODO: Save account types here
  const accountNumber = stmt.Acct.Id.Othr.Id;
  const accountName = stmt.Acct.Nm;
  const currency = stmt.Acct.Ccy;
  const account = {
    accountNumber,
    name: accountName,
    currency,
  } as Account;

  const agent = {
    bic: stmt.Acct.Svcr.FinInstnId.BIC
  } as BICAgent;

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
    balances: [], // TODO
    entries: [], // TODO
  } as Statement;

}