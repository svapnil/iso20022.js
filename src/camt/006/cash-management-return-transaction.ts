import { BalanceInReport, BusinessError, Transaction } from "../types";
import { InvalidStructureError, InvalidXmlNamespaceError } from "../../errors";
import { GenericISO20022Message, ISO20022Messages, ISO20022MessageTypeName, XML } from "../../lib/interfaces";
import { AccountIdentification, Agent, CashAccountType, MessageHeader, Party } from "../../lib/types";
import { exportAccountIdentification, exportAmountToString, exportMessageHeader, parseAccountIdentification, parseAmountToMinorUnits, parseDate, parseMessageHeader, parseParty as parsePartyExt} from "../../parseUtils";
import { exportBalanceReport, exportBusinessError, parseBalanceReport, parseBusinessError } from "../utils";
import { Currency } from "dinero.js";

export interface TransactionReport {
  msgId?: string;
  reqExecutionDate?: Date;
  status?: {
    code: string; 
    reason?: string; // always proprietary for now
  },
  debtor: Party; // includes the agent
  debtorAgent: Agent; // one who operated the payment
  creditor: Party; // includes the agent
  creditorAgent: Agent; // one who operated the payment
}

export interface PaymentIdentification {
  // only support the Long Business Identification for now
  currency: Currency; // note that in ISO the currency is not expected here, but we need it to interpret the amount
  amount: number; // in the smallest unit of the currency (e.g. cents for EUR); The amount is always positive and the direction is given by the debtor/creditor
  endToEndId: string;
  transactionId?: string;
  uetr?: string; // Universally unique identifier
  // add more fields as needed
}

export interface TransactionReportOrError {
  paymentId: PaymentIdentification;
  // one of the two must be present
  report?: TransactionReport;
  error?: BusinessError;
}


export interface CashManagementReturnTransactionData {
  // Define the properties of the CAMT.003 message here
  header: MessageHeader;
  // reports or errors for transactions
  reports: TransactionReportOrError[];
}

export class CashManagementReturnTransaction implements GenericISO20022Message {
  private _data: CashManagementReturnTransactionData;

  constructor(data: CashManagementReturnTransactionData) {
    this._data = data;
  }

  get data(): CashManagementReturnTransactionData {
    return this._data;
  }


  supportedMessages(): ISO20022MessageTypeName[] {
    return [ISO20022Messages.CAMT_006];
  }

  static fromDocumentOject(doc: any): CashManagementReturnTransaction {
    const rawHeader = doc.Document?.RtrTx?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError("Invalid CAMT.006 document: missing MsgHdr");
    }
    const header = parseMessageHeader(rawHeader);
      
    // interpret the report
    let rawReports = doc.Document?.RtrTx?.RptOrErr?.BizRpt?.TxRpt;
    if (!Array.isArray(rawReports)) rawReports = [rawReports];
    rawReports = rawReports.filter( (r : any) =>!!r); // remove null/undefined

    const reports: TransactionReportOrError[] = rawReports.map((r: any) => {
      const rawAmount = r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Amt || r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Amount; // some implementations use Amount instead of Amt
      const paymentId : PaymentIdentification = {
        currency: r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Ccy,
        amount: parseAmountToMinorUnits(rawAmount, r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Ccy),
        endToEndId: r.PmtId?.LngBizId?.EndToEndId,
        transactionId: r.PmtId?.LngBizId?.TxId,
        uetr: r.PmtId?.LngBizId?.UETR,
      };
      // check required fields
      if (!paymentId.currency) {
        throw new InvalidStructureError("Invalid CAMT.006 document: missing Ccy in PmtId.LngBizId.IntrBkSttlmAmt");
      }
      if (paymentId.amount === undefined || paymentId.amount === null || isNaN(paymentId.amount)) {
        throw new InvalidStructureError("Invalid CAMT.006 document: missing or invalid Amt in PmtId.LngBizId.IntrBkSttlmAmt");
      }
      if (!paymentId.endToEndId) {
        throw new InvalidStructureError("Invalid CAMT.006 document: missing EndToEndId in PmtId.LngBizId");
      }

      let report: TransactionReport | undefined = undefined;
      let error: BusinessError | undefined = undefined;

      if (r.TxOrErr?.Tx) {
        // report
        const msgId = r.TxOrErr.Tx.Pmt?.MsgId;
        const reqExecutionDate = r.TxOrErr.Tx.Pmt?.ReqdExctnDt?.Dt ? parseDate(r.TxOrErr.Tx.Pmt.ReqdExctnDt) : undefined;
        const status = ((sts:any)=>{
          if (!sts) return undefined;
          if (Array.isArray(sts) && sts.length === 0) return undefined;
          if (Array.isArray(sts)) sts = sts[0]; // take the first one only
          let code = sts.Cd?.Pdg || sts.Cd?.Fnl || sts.Cd?.RTGS || sts.Cd?.Sttlm || sts.Cd?.Prtly;
          if (code) code = Object.keys(sts.Cd)[0] + ":" + code; // prefix with the type of code
          else return undefined;
          const reason = sts.Rsn?.Prtry;
          return { code, reason };
        })(r.TxOrErr.Tx.Pmt?.Sts);

        // to parse debtor and creditor with their agents
        function parseParty(party: any): Party {
          const p: Party = parsePartyExt(party?.Pty || {}); // force a valid object
          if (party?.Agt) 
            p.agent = { bic: party.Agt.FinInstnId?.BICFI };
          return p;
        } 
        function parseAgent(agent: any): Agent {
          if (!agent) return { bic: "" };
          return { bic: agent?.FinInstnId?.BICFI };
        }

        report = {
          msgId,
          reqExecutionDate,
          status,
          debtor: parseParty(r.TxOrErr.Tx.Pmt?.Pties?.Dbtr),
          debtorAgent: parseAgent(r.TxOrErr.Tx.Pmt?.Pties?.DbtrAgt),
          creditor: parseParty(r.TxOrErr.Tx.Pmt?.Pties?.Cdtr),
          creditorAgent: parseAgent(r.TxOrErr.Tx.Pmt?.Pties?.CdtrAgt),
        }
        // check the debtor and creditor required fields
        if (!report.debtor.id) {
          throw new InvalidStructureError("Invalid CAMT.006 document: missing Id in TxOrErr.Tx.Dbtr.Pty");
        }
        if (!report.creditor.id) {
          throw new InvalidStructureError("Invalid CAMT.006 document: missing Id in TxOrErr.Tx.Cdtr.Pty");
        }
      } else if (r.TxOrErr?.BizErr) {
        // business error
        error = parseBusinessError(r.TxOrErr.BizErr);
      } else {
        throw new InvalidStructureError("Invalid CAMT.006 document: missing TxOrErr");
      }
      return { paymentId, report, error };
    });

    return new CashManagementReturnTransaction({
      header,
      reports,
    });
  }

  static fromXML(xml: string): CashManagementReturnTransaction {
    const parser = XML.getParser();
    const doc = parser.parse(xml);

    if (!doc.Document) {
      throw new Error("Invalid XML format");
    }

    const namespace = (doc.Document['@_xmlns'] || doc.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.004.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.004 namespace');
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
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.004.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';

    return builder.build(obj);

  }
  toJSON(): any {
    // we should not have to serialize but we do it for consistency
    const Document: any = {
      RtrTx: {
        MsgHdr: exportMessageHeader(this._data.header),
        RptOrErr: {
          BizRpt: {
            TxRpt: this._data.reports.map((report) => {
              const obj: any = {
                PmtId: {
                  LngBizId: {
                    IntrBkSttlmAmt: {
                      Amt: exportAmountToString(report.paymentId.amount, report.paymentId.currency),
                      Amount: exportAmountToString(report.paymentId.amount, report.paymentId.currency), // some implementations use Amount instead of Amt
                      Ccy: report.paymentId.currency,
                    },
                    UETR: report.paymentId.uetr,
                    TxId: report.paymentId.transactionId,
                    EndToEndId: report.paymentId.endToEndId,
                  }
                },
                TxOrErr: { }, // filled below
              };

              if (report.report) {
                function exportParty(p?: Party): any {
                  if (!p) return undefined;
                  return {
                    Pty: {
                      Nm: p.name,
                      Id: p.id ? { OrgId: { Othr: { Id: p.id } } } : undefined,
                    },
                    Agt: exportAgent(p.agent),
                  }
                }
                function exportAgent(a?: Agent): any {
                  if (!a) return undefined;
                  if ("bic" in a && a.bic) return { FinInstnId: { BICFI: a.bic } };
                  if ("abaRoutingNumber" in a && a.abaRoutingNumber) return { FinInstId: { Othr: { Id: a.abaRoutingNumber } } };
                  return undefined;
                }
                const [codeType, code] = report.report.status ? report.report.status.code.split(":") : [undefined, undefined];
                obj.TxOrErr.Tx = {
                  Pmt: {
                    MsgId: report.report.msgId,
                    ReqdExctnDt: {Dt: report.report.reqExecutionDate?.toISOString()?.slice(0,10)},
                    Sts: {
                      Cd: codeType ? { [codeType]: code } : undefined,
                      Rsn: report.report.status?.reason ? { Prtry: report.report.status.reason } : undefined,
                    },
                    Pties: {
                      Dbtr: exportParty(report.report.debtor),
                      DbtrAgt: exportAgent(report.report.debtorAgent),
                      Cdtr: exportParty(report.report.creditor),
                      CdtrAgt: exportAgent(report.report.creditorAgent),
                    }
                  }
                };
              } else if (report.error) {
                obj.TxOrErr.BizErr = exportBusinessError(report.error);
              }
              
              return obj;
            })
          }
        }
      }
    };
    return { Document };
  }
}