import { BusinessError } from "../types";
import { InvalidStructureError, InvalidXmlNamespaceError } from "../../errors";
import { GenericISO20022Message, ISO20022Messages, ISO20022MessageTypeName, registerISO20022Implementation, XML } from "../../lib/interfaces";
import { Agent, MessageHeader, Party } from "../../lib/types";
import { exportAmountToString, exportMessageHeader, parseAgent, parseAmountToMinorUnits, parseDate, parseMessageHeader, parseParty } from "../../parseUtils";
import { exportBusinessError, parseBusinessError } from "../utils";
import { Currency } from "../../lib/currency";

export interface TransactionReport {
  msgId?: string;
  reqExecutionDate?: Date;
  /**
   * Payment status. `code` is `<branch>:<value>` over PaymentStatusCode6Choice
   * (e.g. `Sttlm:ACCC`, `Fnl:STLD`, `Prtry:CUST`). `reason` follows the same
   * convention for the coded branches of PaymentStatusReason1Choice
   * (`Umtchd:DMON`, `Canc:CANI`, `PrtryRjctn:XXXX`) and is the bare text for
   * the Prtry branch. Only the first Sts and first Rsn are read.
   */
  status?: {
    code: string;
    reason?: string;
  };
  /** Party50Choice: a party (Pty) or, when the bank identifies it as an institution, just an agent. */
  debtor?: Party;
  debtorAgent?: Agent;
  creditor?: Party;
  creditorAgent?: Agent;
}

/** Which branch of PaymentIdentification8Choice carried the identifier. */
export type PaymentIdentifierType = 'TxId' | 'UETR' | 'QId' | 'LngBizId' | 'ShrtBizId' | 'PrtryId';

export interface PaymentIdentification {
  identifierType: PaymentIdentifierType;
  /**
   * LngBizId/IntrBkSttlmAmt is ImpliedCurrencyAndAmount — a bare decimal. The
   * currency is read from Tx/Pmt/IntrBkSttlmAmt or InstdAmt (AmtWthCcy) when
   * the bank provides it. Absent that, `amount` is converted assuming two
   * decimal places.
   */
  currency?: Currency;
  /** In the smallest unit of `currency`. Only LngBizId carries an amount. */
  amount?: number;
  /** IntrBkSttlmDt — mandatory on both LngBizId and ShrtBizId. */
  settlementDate?: Date;
  instructingAgent?: Agent;
  instructedAgent?: Agent;
  endToEndId?: string;
  transactionId?: string;
  uetr?: string;
  queueId?: string;
  proprietaryId?: string;
}

export interface TransactionReportOrError {
  paymentId: PaymentIdentification;
  report?: TransactionReport;
  error?: BusinessError;
}

export interface CashManagementReturnTransactionData {
  header: MessageHeader;
  reports: TransactionReportOrError[];
}

const NAMESPACE_PREFIX = 'urn:iso:std:iso:20022:tech:xsd:camt.006.001.';
const SERIALIZE_NAMESPACE = `${NAMESPACE_PREFIX}11`;

const IDENTIFIER_BRANCHES: PaymentIdentifierType[] = ['LngBizId', 'ShrtBizId', 'TxId', 'UETR', 'QId', 'PrtryId'];
const STATUS_CODE_BRANCHES = ['Pdg', 'Fnl', 'RTGS', 'Sttlm', 'Prtry'] as const;
const STATUS_REASON_CODED_BRANCHES = ['Umtchd', 'Canc', 'Sspd', 'PdgFlngSttlm', 'PdgSttlm'] as const;

const first = <T>(v: T | T[] | undefined): T | undefined => (Array.isArray(v) ? v[0] : v);

const parsePaymentIdentification = (pmtId: any): PaymentIdentification => {
  if (!pmtId) {
    throw new InvalidStructureError("Invalid CAMT.006 document: missing PmtId");
  }
  const identifierType = IDENTIFIER_BRANCHES.find((b) => pmtId[b] !== undefined);
  if (!identifierType) {
    throw new InvalidStructureError("Invalid CAMT.006 document: PmtId has none of TxId, UETR, QId, LngBizId, ShrtBizId or PrtryId");
  }
  const lng = pmtId.LngBizId;
  const biz = lng ?? pmtId.ShrtBizId;
  return {
    identifierType,
    settlementDate: parseDate(biz?.IntrBkSttlmDt),
    instructingAgent: parseAgent(biz?.InstgAgt),
    instructedAgent: parseAgent(biz?.InstdAgt),
    endToEndId: lng?.EndToEndId,
    transactionId: biz?.TxId ?? pmtId.TxId,
    uetr: biz?.UETR ?? pmtId.UETR,
    queueId: pmtId.QId?.QId,
    proprietaryId: pmtId.PrtryId,
  };
};

const parseStatus = (rawSts: any): TransactionReport['status'] => {
  const sts = first(rawSts);
  const cd = sts?.Cd;
  const codeBranch = cd ? STATUS_CODE_BRANCHES.find((b) => cd[b] !== undefined) : undefined;
  if (!codeBranch) return undefined;
  const code = `${codeBranch}:${cd[codeBranch]}`;

  const rsn = first(sts.Rsn);
  let reason: string | undefined;
  if (rsn?.Prtry !== undefined) {
    reason = String(rsn.Prtry);
  } else if (rsn?.PrtryRjctn) {
    reason = `PrtryRjctn:${rsn.PrtryRjctn.PrtryStsRsn}`;
  } else if (rsn) {
    const b = STATUS_REASON_CODED_BRANCHES.find((b) => rsn[b] !== undefined);
    if (b) reason = `${b}:${rsn[b]}`;
  }
  return { code, reason };
};

/** Party50Choice is Pty | Agt. */
const parsePartyChoice = (choice: any): Party | undefined => {
  if (choice?.Pty) return parseParty(choice.Pty);
  if (choice?.Agt) {
    const agent = parseAgent(choice.Agt);
    return agent ? ({ agent } as Party) : undefined;
  }
  return undefined;
};

export class CashManagementReturnTransaction implements GenericISO20022Message {
  private _data: CashManagementReturnTransactionData;

  constructor(data: CashManagementReturnTransactionData) {
    this._data = data;
  }

  get data(): CashManagementReturnTransactionData {
    return this._data;
  }

  static supportedMessages(): ISO20022MessageTypeName[] {
    return [ISO20022Messages.CAMT_006];
  }

  static fromDocumentOject(doc: any): CashManagementReturnTransaction {
    const rawHeader = doc.Document?.RtrTx?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError("Invalid CAMT.006 document: missing MsgHdr");
    }
    const header = parseMessageHeader(rawHeader);

    let rawReports = doc.Document?.RtrTx?.RptOrErr?.BizRpt?.TxRpt;
    if (!Array.isArray(rawReports)) rawReports = [rawReports];
    rawReports = rawReports.filter((r: any) => !!r);

    const reports: TransactionReportOrError[] = rawReports.map((r: any) => {
      const paymentId = parsePaymentIdentification(r.PmtId);
      const pmt = r.TxOrErr?.Tx?.Pmt;

      // Currency lives on Pmt (Amount2Choice/Amount3Choice AmtWthCcy). The
      // pre-conformance dialect put {Amt, Ccy} inside LngBizId/IntrBkSttlmAmt;
      // keep reading it so existing JSON inputs still work.
      const rawSttlmAmt = r.PmtId?.LngBizId?.IntrBkSttlmAmt;
      const legacyAmountBlock = rawSttlmAmt !== null && typeof rawSttlmAmt === 'object' ? rawSttlmAmt : undefined;
      const ccyNode = pmt?.IntrBkSttlmAmt?.AmtWthCcy ?? pmt?.InstdAmt?.AmtWthCcy;
      paymentId.currency = ccyNode?.['@_Ccy'] ?? legacyAmountBlock?.Ccy;

      const rawAmount = legacyAmountBlock
        ? legacyAmountBlock.Amt ?? legacyAmountBlock.Amount ?? legacyAmountBlock['#text']
        : rawSttlmAmt;
      if (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') {
        const amount = parseAmountToMinorUnits(rawAmount, paymentId.currency);
        if (isNaN(amount)) {
          throw new InvalidStructureError("Invalid CAMT.006 document: invalid Amt in PmtId.LngBizId.IntrBkSttlmAmt");
        }
        paymentId.amount = amount;
      }

      let report: TransactionReport | undefined = undefined;
      let error: BusinessError | undefined = undefined;

      if (r.TxOrErr?.Tx) {
        const pties = pmt?.Pties;
        report = {
          msgId: pmt?.MsgId,
          reqExecutionDate: parseDate(pmt?.ReqdExctnDt),
          status: parseStatus(pmt?.Sts),
          debtor: parsePartyChoice(pties?.Dbtr),
          debtorAgent: parseAgent(pties?.DbtrAgt),
          creditor: parsePartyChoice(pties?.Cdtr),
          creditorAgent: parseAgent(pties?.CdtrAgt),
        };
      } else if (r.TxOrErr?.BizErr) {
        error = parseBusinessError(r.TxOrErr.BizErr);
      } else {
        throw new InvalidStructureError("Invalid CAMT.006 document: missing TxOrErr");
      }
      return { paymentId, report, error };
    });

    return new CashManagementReturnTransaction({ header, reports });
  }

  static fromXML(xml: string): CashManagementReturnTransaction {
    const parser = XML.getParser();
    const doc = parser.parse(xml);

    if (!doc.Document) {
      throw new Error("Invalid XML format");
    }

    const namespace = (doc.Document['@_xmlns'] || doc.Document['@_Xmlns']) as string;
    if (!namespace.startsWith(NAMESPACE_PREFIX)) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.006 namespace');
    }
    return CashManagementReturnTransaction.fromDocumentOject(doc);
  }

  static fromJSON(json: string): CashManagementReturnTransaction {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new Error("Invalid JSON format");
    }
    return CashManagementReturnTransaction.fromDocumentOject(obj);
  }

  serialize(): string {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = SERIALIZE_NAMESPACE;
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }

  toJSON(): any {
    // Element order below follows the xs:sequence of each camt.006.001.11 type.
    const exportAgent = (a?: Agent): any => {
      if (!a) return undefined;
      if ("bic" in a && a.bic) return { FinInstnId: { BICFI: a.bic } };
      if ("abaRoutingNumber" in a && a.abaRoutingNumber) return { FinInstnId: { Othr: { Id: a.abaRoutingNumber } } };
      return undefined;
    };
    const exportParty = (p?: Party): any => {
      if (!p) return undefined;
      if (p.name === undefined && p.id === undefined && p.agent) return { Agt: exportAgent(p.agent) };
      return {
        Pty: {
          Nm: p.name,
          Id: p.id ? { OrgId: { Othr: { Id: p.id } } } : undefined,
        },
      };
    };
    const exportPaymentId = (id: PaymentIdentification): any => {
      const date = id.settlementDate?.toISOString().slice(0, 10);
      switch (id.identifierType) {
        case 'LngBizId':
          return { LngBizId: {
            TxId: id.transactionId,
            UETR: id.uetr,
            IntrBkSttlmAmt: id.amount !== undefined ? exportAmountToString(id.amount, id.currency) : undefined,
            IntrBkSttlmDt: date,
            InstgAgt: exportAgent(id.instructingAgent),
            InstdAgt: exportAgent(id.instructedAgent),
            EndToEndId: id.endToEndId,
          } };
        case 'ShrtBizId':
          return { ShrtBizId: { TxId: id.transactionId, UETR: id.uetr, IntrBkSttlmDt: date, InstgAgt: exportAgent(id.instructingAgent) } };
        case 'TxId': return { TxId: id.transactionId };
        case 'UETR': return { UETR: id.uetr };
        case 'QId': return { QId: { QId: id.queueId } };
        case 'PrtryId': return { PrtryId: id.proprietaryId };
      }
    };
    const exportStatus = (s?: TransactionReport['status']): any => {
      if (!s) return undefined;
      const [codeBranch, ...codeRest] = s.code.split(':');
      const codeValue = codeRest.join(':');
      let Rsn: any = undefined;
      if (s.reason !== undefined) {
        const idx = s.reason.indexOf(':');
        const branch = idx > 0 ? s.reason.slice(0, idx) : undefined;
        Rsn = branch && (STATUS_REASON_CODED_BRANCHES as readonly string[]).includes(branch)
          ? { [branch]: s.reason.slice(idx + 1) }
          : { Prtry: s.reason };
      }
      return { Cd: { [codeBranch]: codeValue }, Rsn };
    };

    const Document: any = {
      RtrTx: {
        MsgHdr: exportMessageHeader(this._data.header),
        RptOrErr: {
          BizRpt: {
            TxRpt: this._data.reports.map((report) => {
              const obj: any = { PmtId: exportPaymentId(report.paymentId), TxOrErr: {} };
              if (report.report) {
                const rr = report.report;
                const hasParties = rr.debtor || rr.debtorAgent || rr.creditor || rr.creditorAgent;
                const ccyAmount = report.paymentId.currency && report.paymentId.amount !== undefined
                  ? { AmtWthCcy: { '#text': exportAmountToString(report.paymentId.amount, report.paymentId.currency), '@_Ccy': report.paymentId.currency } }
                  : undefined;
                obj.TxOrErr.Tx = {
                  Pmt: {
                    MsgId: rr.msgId,
                    ReqdExctnDt: rr.reqExecutionDate ? { DtTm: rr.reqExecutionDate.toISOString() } : undefined,
                    Sts: exportStatus(rr.status),
                    IntrBkSttlmAmt: ccyAmount,
                    Pties: hasParties ? {
                      Dbtr: exportParty(rr.debtor),
                      DbtrAgt: exportAgent(rr.debtorAgent),
                      CdtrAgt: exportAgent(rr.creditorAgent),
                      Cdtr: exportParty(rr.creditor),
                    } : undefined,
                  },
                };
              } else if (report.error) {
                obj.TxOrErr.BizErr = exportBusinessError(report.error);
              }
              return obj;
            }),
          },
        },
      },
    };
    return { Document };
  }
}

registerISO20022Implementation(CashManagementReturnTransaction);
