import { XMLParser } from 'fast-xml-parser';
import { Party } from '../../lib/types';
import { parseParty } from '../../parseUtils';
import {
  parseGroupStatusInformation,
  parsePaymentStatusInformations,
  parseTransactionStatusInformations,
} from './utils';
import {
  StatusInformation,
  PaymentStatus,
  OriginalGroupInformation,
} from './types';

/**
 * Configuration interface for creating a PaymentStatusReport instance.
 */
interface PaymentStatusReportConfig {
  /** Unique identifier for the message */
  messageId: string;
  creationDate: Date;
  initatingParty: Party;
  originalGroupInformation: OriginalGroupInformation;
  statusInformations: StatusInformation[];
}

/**
 * Represents a Payment Status Report, containing information about the status of payments and transactions.
 */
export class PaymentStatusReport {
  private _messageId: string;
  private _creationDate: Date;
  private _initatingParty: Party;
  private _originalGroupInformation: OriginalGroupInformation;
  private _statusInformations: StatusInformation[];

  /**
   * Creates a new PaymentStatusReport instance.
   * @param {PaymentStatusReportConfig} config - The configuration object for the PaymentStatusReport.
   */
  constructor(config: PaymentStatusReportConfig) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._initatingParty = config.initatingParty;
    this._originalGroupInformation = config.originalGroupInformation;
    this._statusInformations = config.statusInformations;
  }

  /**
   * Creates a PaymentStatusReport instance from an XML string.
   * @param {string} rawXml - The raw XML string to parse.
   * @returns {PaymentStatusReport} A new PaymentStatusReport instance.
   */
  static fromXML(rawXml: string): PaymentStatusReport {
    const parser = new XMLParser({ ignoreAttributes: false });
    const xml = parser.parse(rawXml);
    const customerPaymentStatusReport = xml.Document.CstmrPmtStsRpt;
    const rawCreationDate = customerPaymentStatusReport.GrpHdr.CreDtTm;
    const messageId = customerPaymentStatusReport.GrpHdr.MsgId;
    const creationDate = new Date(rawCreationDate);
    const initatingParty = parseParty(
      customerPaymentStatusReport.GrpHdr.InitgPty,
    );

    const rawOriginalGroupInformation =
      customerPaymentStatusReport.OrgnlGrpInfAndSts;
    const originalGroupInformation = {
      originalMessageId: rawOriginalGroupInformation.OrgnlMsgId,
    };

    const rawPmtInfAndSts = customerPaymentStatusReport.OrgnlPmtInfAndSts;
    const pmtInfAndSts = Array.isArray(rawPmtInfAndSts)
      ? rawPmtInfAndSts
      : [rawPmtInfAndSts].filter(Boolean);
    // Find all TxnInfoAndSts
    const txnInfoAndSts = pmtInfAndSts
      .map(pmtInfAndSt => {
        // If there is no TxInfAndSts, return an empty array
        if (!pmtInfAndSt.hasOwnProperty('TxInfAndSts')) {
          return [];
        }
        // Otherwise, return the TxInfAndSts
        return Array.isArray(pmtInfAndSt.TxInfAndSts)
          ? pmtInfAndSt.TxInfAndSts
          : [pmtInfAndSt.TxInfAndSts];
      })
      .flat();

    const statusInformations = [
      parseGroupStatusInformation(
        customerPaymentStatusReport.OrgnlGrpInfAndSts,
      ),
      parsePaymentStatusInformations(pmtInfAndSts),
      parseTransactionStatusInformations(txnInfoAndSts),
    ]
      .flat()
      .filter(statusInformation => statusInformation !== null);

    return new PaymentStatusReport({
      messageId,
      creationDate,
      initatingParty,
      originalGroupInformation,
      statusInformations: statusInformations,
    });
  }

  /**
   * Gets the message ID of the Payment Status Report.
   * @returns {string} The message ID.
   */
  get messageId(): string {
    return this._messageId;
  }

  /**
   * Gets the creation date of the Payment Status Report.
   * @returns {Date} The creation date.
   */
  get creationDate(): Date {
    return this._creationDate;
  }

  /**
   * Gets the initiating party of the Payment Status Report.
   * @returns {Party} The initiating party.
   */
  get initatingParty(): Party {
    return this._initatingParty;
  }

  /**
   * Gets the original message ID from the original group information.
   * @returns {string} The original message ID.
   */
  get originalMessageId(): string {
    return this._originalGroupInformation.originalMessageId;
  }

  /**
   * Gets all status information entries in the Payment Status Report.
   * @returns {StatusInformation[]} An array of StatusInformation objects.
   */
  get statusInformations(): StatusInformation[] {
    return this._statusInformations;
  }

  /**
   * Gets the first status information entry in the Payment Status Report.
   * @returns {StatusInformation} The first StatusInformation object in the statuses array.
   */
  get firstStatusInformation(): StatusInformation {
    return this._statusInformations[0];
  }

  /**
   * Gets the original ID based on the type of the first status information.
   * @returns {string} The original ID, which could be the original message ID, payment ID, or end-to-end ID.
   */
  get originalId(): string {
    const firstStatusInformation = this
      .firstStatusInformation as StatusInformation;
    switch (firstStatusInformation.type) {
      case 'group':
        return firstStatusInformation.originalMessageId;
      case 'payment':
        return firstStatusInformation.originalPaymentId;
      case 'transaction':
        return firstStatusInformation.originalEndToEndId;
    }
  }

  /**
   * Gets the status from the first status information entry.
   * @returns {PaymentStatus} The Status from the first status information.
   */
  get status(): PaymentStatus {
    return this.firstStatusInformation.status;
  }
}
