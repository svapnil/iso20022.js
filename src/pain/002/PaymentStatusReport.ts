import { XMLParser } from 'fast-xml-parser';
import { Party } from '../../lib/types';
import { parseParty } from '../../parseUtils';
import {
  parseGroupStatus,
  parsePaymentStatuses,
  parseTransactionStatuses,
} from './utils';

interface OriginalGroupInformation {
  originalMessageId: string;
}

interface PaymentStatusReportConfig {
  messageId: string;
  creationDate: Date;
  initatingParty: Party;
  originalGroupInformation: OriginalGroupInformation;
  statuses: StatusInformation[];
}

export type StatusType = 'group' | 'payment' | 'transaction';
export type Status =
  | 'rejected'
  | 'pending'
  | 'accepted'
  | 'acceptedPendingSettlement'
  | 'acceptedSettlementInProgress'
  | 'acceptedSettlementCompleted';

interface BaseStatus {
  type: StatusType;
  status: Status;
  reason?: {
    code: string;
    additionalInformation: string;
  };
}

export interface GroupStatus extends BaseStatus {
  type: 'group';
  originalMessageId: string;
}

export interface PaymentStatus extends BaseStatus {
  type: 'payment';
  originalPaymentId: string;
}

export interface TransactionStatus extends BaseStatus {
  type: 'transaction';
  originalEndToEndId: string;
}

export type StatusInformation = GroupStatus | PaymentStatus | TransactionStatus;

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

    const statuses = [
      parseGroupStatus(customerPaymentStatusReport.OrgnlGrpInfAndSts),
      parsePaymentStatuses(customerPaymentStatusReport.OrgnlPmtInfAndSts),
      parseTransactionStatuses(customerPaymentStatusReport.OrgnlPmtInfAndSts),
    ]
      .flat()
      .filter(status => status !== null);

    debugger;

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
    const firstStatusInformation = this.firstStatusInformation as StatusInformation;
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
