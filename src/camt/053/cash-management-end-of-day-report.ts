import { Balance, Entry, Statement, Transaction } from '../types';
import { Party, StructuredAddress } from '../../lib/types';
import { exportStatement, parseStatement } from '../utils';
import { exportRecipient, parseRecipient } from '../../parseUtils';
import {
  InvalidXmlError,
  InvalidXmlNamespaceError,
} from '../../errors';
import { GenericISO20022Message, ISO20022Messages, ISO20022MessageTypeName, registerISO20022Implementation, XML } from '../../lib/interfaces';

/**
 * Configuration interface for creating a CashManagementEndOfDayReport instance.
 */
interface CashManagementEndOfDayReportConfig {
  /** Unique identifier for the message */
  messageId: string;
  /** Date and time when the report was created */
  creationDate: Date;
  /** Recipient (party without bank and institution) receiving the report */
  recipient?: {
    id?: string;
    name?: string;
    address?: StructuredAddress;
  };
  /** Array of bank statements included in the report */
  statements: Statement[];
}
/**
 * Represents a Cash Management End of Day Report (CAMT.053.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.053 XML file.
 */
export class CashManagementEndOfDayReport implements GenericISO20022Message {
  private _messageId: string;
  private _creationDate: Date;
  private _recipient?: {
    name?: string;
    id?: string;
    address?: StructuredAddress;
  };
  private _statements: Statement[];

  constructor(config: CashManagementEndOfDayReportConfig) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._recipient = config.recipient;
    this._statements = config.statements;
  }

  static supportedMessages(): ISO20022MessageTypeName[] {
    return [ISO20022Messages.CAMT_053];
  }

  
  get data(): CashManagementEndOfDayReportConfig {
    return {
      messageId: this._messageId,
      creationDate: this._creationDate,
      recipient: this._recipient,
      statements: this._statements,
    };
  }

  static fromDocumentObject(obj: {Document: any}): CashManagementEndOfDayReport {
    const bankToCustomerStatement = obj.Document.BkToCstmrStmt;
    const rawCreationDate = bankToCustomerStatement.GrpHdr.CreDtTm;
    const creationDate = new Date(rawCreationDate);

    let statements: Statement[] = [];
    if (Array.isArray(bankToCustomerStatement.Stmt)) {
      statements = bankToCustomerStatement.Stmt.map((stmt: any) =>
        parseStatement(stmt),
      );
    } else {
      statements = [parseStatement(bankToCustomerStatement.Stmt)];
    }

    const rawRecipient = bankToCustomerStatement.GrpHdr.MsgRcpt;
    return new CashManagementEndOfDayReport({
      messageId: bankToCustomerStatement.GrpHdr.MsgId.toString(),
      creationDate,
      recipient: rawRecipient ? parseRecipient(rawRecipient) : undefined,
      statements: statements,
    });
  }

  /**
   * Creates a CashManagementEndOfDayReport instance from a raw XML string.
   *
   * @param {string} rawXml - The raw XML string containing the CAMT.053 data.
   * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport.
   * @throws {Error} If the XML parsing fails or required data is missing.
   */
  static fromXML(rawXml: string): CashManagementEndOfDayReport {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);

    if (!xml.Document) {
      throw new InvalidXmlError("Invalid XML format");
    }

    const namespace = (xml.Document['@_xmlns'] || xml.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.053.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.053 namespace');
    }

    return CashManagementEndOfDayReport.fromDocumentObject(xml);
  }

  /**
   * 
   * @param json - JSON string representing a CashManagementEndOfDayReport
   * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport
   * @throws {Error} If the JSON parsing fails or required data is missing.
   */
  static fromJSON(json: string): CashManagementEndOfDayReport {
    const obj = JSON.parse(json);

    if (!obj.Document) {
      throw new InvalidXmlError("Invalid JSON format");
    }

    return CashManagementEndOfDayReport.fromDocumentObject(obj);
  }

  toJSON(): any {
    const Document = {
      BkToCstmrStmt: {
        GrpHdr: {
          MsgId: this._messageId,
          CreDtTm: this._creationDate.toISOString(),
          MsgRcpt: this._recipient ? exportRecipient(this._recipient) : undefined,
        },
        Stmt: this._statements.map((stmt) => exportStatement(stmt)),
      }
    }
    return { Document };
  }

  serialize(): string {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';

    return builder.build(obj);
  }
  /**
   * Retrieves all balances from all statements in the report.
   * @returns {Balance[]} An array of all balances across all statements.
   */
  get balances(): Balance[] {
    return this._statements.flatMap(statement => statement.balances);
  }

  /**
   * Retrieves all transactions from all statements in the report.
   * @returns {Transaction[]} An array of all transactions across all statements.
   */
  get transactions(): Transaction[] {
    return this._statements
      .flatMap(statement => statement.entries)
      .flatMap(entry => entry.transactions);
  }

  /**
   * Retrieves all entries from all statements in the report.
   * @returns {Entry[]} An array of all entries across all statements.
   */
  get entries(): Entry[] {
    return this._statements.flatMap(statement => statement.entries);
  }

  /**
   * Gets the unique identifier for the message.
   * @returns {string} The message ID.
   */
  get messageId(): string {
    return this._messageId;
  }

  /**
   * Gets the party receiving the report.
   * @returns {Party | undefined} The recipient party information, or undefined if no recipient is set.
   */
  get recipient(): Party | undefined {
    return this._recipient;
  }

  /**
   * Gets the date and time when the report was created.
   * @returns {Date} The creation date of the report.
   */
  get creationDate(): Date {
    return this._creationDate;
  }

  /**
   * Gets all statements included in the report.
   * @returns {Statement[]} An array of all statements in the report.
   */
  get statements(): Statement[] {
    return this._statements;
  }

}

registerISO20022Implementation(CashManagementEndOfDayReport);
