import { XMLParser } from 'fast-xml-parser';
import { Party } from '../../lib/types';
import { parseParty } from '../../parseUtils';
import {
  parseGroupStatus,
  parsePaymentStatuses,
  parseTransactionStatuses,
} from './utils';
import {
  StatusInformation,
  Status,
  OriginalGroupInformation,
} from './types';

interface PaymentStatusReportConfig {
  messageId: string;
  creationDate: Date;
  initatingParty: Party;
  originalGroupInformation: OriginalGroupInformation;
  statuses: StatusInformation[];
}

export class PaymentStatusReport {
  private _messageId: string;
  private _creationDate: Date;
  private _initatingParty: Party;
  private _originalGroupInformation: OriginalGroupInformation;
  private _statuses: StatusInformation[];

  constructor(config: PaymentStatusReportConfig) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._initatingParty = config.initatingParty;
    this._originalGroupInformation = config.originalGroupInformation;
    this._statuses = config.statuses;
  }

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

    const statuses = [
      parseGroupStatus(customerPaymentStatusReport.OrgnlGrpInfAndSts),
      parsePaymentStatuses(pmtInfAndSts),
      parseTransactionStatuses(txnInfoAndSts),
    ]
      .flat()
      .filter(status => status !== null);

    return new PaymentStatusReport({
      messageId,
      creationDate,
      initatingParty,
      originalGroupInformation,
      statuses,
    });
  }

  get messageId() {
    return this._messageId;
  }

  get creationDate() {
    return this._creationDate;
  }

  get initatingParty() {
    return this._initatingParty;
  }

  get originalMessageId() {
    return this._originalGroupInformation.originalMessageId;
  }

  get statuses() {
    return this._statuses;
  }

  get firstStatusInformation() {
    return this._statuses[0];
  }

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

  get status(): Status {
    return this.firstStatusInformation.status;
  }
}
