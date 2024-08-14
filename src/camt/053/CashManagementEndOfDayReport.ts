import { Statement } from "camt/types";
import { Account, Party, BICAgent } from "../../lib/types";
import { XMLParser } from "fast-xml-parser";

const parseStatement = (stmt: any): Statement => {
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

interface CashManagementEndOfDayReportConfig {
  messageId: string;
  creationDate: Date;
  recipient: Party;
  statements: Statement[];
}

export class CashManagementEndOfDayReport {
  private _messageId: string;
  private _creationDate: Date;
  private _recipient: Party;
  private _statements: Statement[];

  constructor(config: CashManagementEndOfDayReportConfig) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._recipient = config.recipient;
    this._statements = config.statements;
  }

  static fromXML(rawXml: string): CashManagementEndOfDayReport {
    const parser = new XMLParser();
    const xml = parser.parse(rawXml);
    const bankToCustomerStatement = xml.Document.BkToCstmrStmt;
    const rawCreationDate = bankToCustomerStatement.CreDtTm;
    const creationDate = new Date(rawCreationDate);

    let statements: Statement[] = [];
    if (Array.isArray(bankToCustomerStatement.Stmt)) {
      statements = bankToCustomerStatement.Stmt.map((stmt: any) => parseStatement(stmt));
    } else {
      statements = [parseStatement(bankToCustomerStatement.Stmt)];
    }

    return new CashManagementEndOfDayReport({
      messageId: bankToCustomerStatement.GrpHdr.MsgId.toString(),
      creationDate,
      recipient: {
        id: bankToCustomerStatement.GrpHdr.MsgRcpt.Id.OrgId.Othr.Id,
        name: bankToCustomerStatement.GrpHdr.MsgRcpt.Nm,
      },
      statements: statements
    });
  }

  get messageId(): string {
    return this._messageId;
  }

  get recipient(): Party {
    return this._recipient;
  }

  get creationDate(): Date {
    return this._creationDate;
  }

  get statements(): Statement[] {
    return this._statements;
  }
}