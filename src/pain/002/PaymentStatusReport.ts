import { XMLParser } from 'fast-xml-parser';
import { Party } from '../../lib/types';
import { parseParty } from '../../parseUtils';

export interface ReasonInformation {
  code: string;
  additionalInformation: string;
}

interface OriginalGroupInformation {
  originalMessageId: string;
}

interface PaymentStatusReportConfig {
  messageId: string;
  creationDate: Date;
  initatingParty: Party;
  originalGroupInformation: OriginalGroupInformation;
}

export class PaymentStatusReport {
  private _messageId: string;
  private _creationDate: Date;
  private _initatingParty: Party;
  private _originalGroupInformation: OriginalGroupInformation;

  constructor(config: PaymentStatusReportConfig) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._initatingParty = config.initatingParty;
    this._originalGroupInformation = config.originalGroupInformation;
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

    return new PaymentStatusReport({
      messageId,
      creationDate,
      initatingParty,
      originalGroupInformation,
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

  get originalGroupInformation() {
    return this._originalGroupInformation;
  }
}
