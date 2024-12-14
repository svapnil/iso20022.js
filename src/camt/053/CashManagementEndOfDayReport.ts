import { Balance, Entry, Statement, Transaction } from '../types';
import { Party } from '../../lib/types';
import { XMLParser } from 'fast-xml-parser';
import { parseStatement } from './utils';
import { parseParty } from '../../parseUtils';
import {
  InvalidXmlError,
  InvalidXmlNamespaceError,
} from '../../errors';

/**
 * Configuration interface for creating a CashManagementEndOfDayReport instance.
 */
interface CashManagementEndOfDayReportConfig {
  /** Unique identifier for the message */
  messageId: string;
  /** Date and time when the report was created */
  creationDate: Date;
  /** Party receiving the report */
  recipient?: Party;
  /** Array of bank statements included in the report */
  statements: Statement[];
}
/**
 * Represents a Cash Management End of Day Report (CAMT.053.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.053 XML file.
 */
export class CashManagementEndOfDayReport {
  private _messageId: string;
  private _creationDate: Date;
  private _recipient?: Party;
  private _statements: Statement[];

  constructor(config: CashManagementEndOfDayReportConfig) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._recipient = config.recipient;
    this._statements = config.statements;
  }

  /**
   * Creates and configures the XML Parser
   *
   * @returns {XMLParser} A configured instance of XMLParser
   */
  private static getParser(): XMLParser {
    return new XMLParser({
      ignoreAttributes: false,
      tagValueProcessor: (
        tagName,
        tagValue,
        _jPath,
        _hasAttributes,
        isLeafNode,
      ) => {
        /**
         * Codes and Entry References can look like numbers and get parsed
         * appropriately. We don't want this to happen, as they contain leading
         * zeros or are too long and overflow.
         *
         * Ex. <Cd>0001234<Cd> Should resolve to "0001234"
         */
        if (isLeafNode && ['Cd', 'NtryRef'].includes(tagName)) return undefined;
        return tagValue;
      },
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
    const parser = CashManagementEndOfDayReport.getParser();
    const xml = parser.parse(rawXml);

    if (!xml.Document) {
      throw new InvalidXmlError("Invalid XML format");
    }

    const namespace = (xml.Document['@_xmlns'] || xml.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.053.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.053 namespace');
    }

    const bankToCustomerStatement = xml.Document.BkToCstmrStmt;
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

    const party = bankToCustomerStatement.GrpHdr.MsgRcpt;
    return new CashManagementEndOfDayReport({
      messageId: bankToCustomerStatement.GrpHdr.MsgId.toString(),
      creationDate,
      recipient: party ? parseParty(party) : undefined,
      statements: statements,
    });
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
