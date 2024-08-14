import { Statement } from "camt/types";
import { Party }  from "../../lib/types";
import { XMLParser } from "fast-xml-parser";
import { parseStatement } from "./utils";

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