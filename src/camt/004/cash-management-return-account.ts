import { BalanceInReport, BusinessError } from "../types";
import { InvalidStructureError, InvalidXmlNamespaceError } from "../../errors";
import { GenericISO20022Message, ISO20022Messages, ISO20022MessageTypeName, registerISO20022Implementation, XML } from "../../lib/interfaces";
import { AccountIdentification, CashAccountType, MessageHeader } from "../../lib/types";
import { exportAccountIdentification, exportMessageHeader, parseAccountIdentification, parseMessageHeader } from "../../parseUtils";
import { exportBalanceReport, exportBusinessError, parseBalanceReport, parseBusinessError } from "../utils";
import { Currency } from "dinero.js";

export interface AccountReport {
  currency: Currency;
  name?: string;
  type?: CashAccountType | string;
  balances: BalanceInReport[];
}

export interface AccountReportOrError {
  accountId: AccountIdentification;
  // one of the two must be present
  report?: AccountReport;
  error?: BusinessError;
}

export interface CashManagementReturnAccountData {
  // Define the properties of the CAMT.003 message here
  header: MessageHeader;
  // reports or errors for accounts
  reports: AccountReportOrError[];
}

export class CashManagementReturnAccount implements GenericISO20022Message {
  private _data: CashManagementReturnAccountData;

  constructor(data: CashManagementReturnAccountData) {
    this._data = data;
  }

  get data(): CashManagementReturnAccountData {
    return this._data;
  }
  static supportedMessages(): ISO20022MessageTypeName[] {
    return [ISO20022Messages.CAMT_004];
  }

  static fromDocumentOject(doc: any): CashManagementReturnAccount {
    const rawHeader = doc.Document?.RtrAcct?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError("Invalid CAMT.004 document: missing MsgHdr");
    }
    const header = parseMessageHeader(rawHeader);
      
    // interpret the report
    let rawReports = doc.Document?.RtrAcct?.RptOrErr?.AcctRpt;
    if (!Array.isArray(rawReports)) rawReports = [rawReports];
    rawReports = rawReports.filter( (r : any) =>!!r); // remove null/undefined

    const reports: AccountReportOrError[] = rawReports.map((r: any) => {
      const accountId = parseAccountIdentification(r.AcctId);
      let report: AccountReport | undefined = undefined;
      let error: BusinessError | undefined = undefined;

      if (r.AcctOrErr?.Acct) {
        // report
        if (!r.AcctOrErr.Acct.Ccy) {
          throw new InvalidStructureError("Invalid CAMT.004 document: missing Ccy in Acct");
        }
        let rawMulBal = r.AcctOrErr.Acct.MulBal;
        if (!Array.isArray(rawMulBal)) rawMulBal = [rawMulBal];
        rawMulBal = rawMulBal.filter( (b : any) =>!!b);

        report = {
          currency: r.AcctOrErr.Acct.Ccy,
          name: r.AcctOrErr.Acct.Nm,
          type: r.AcctOrErr.Acct.Tp?.Cd || r.AcctOrErr.Acct.Tp?.Prtry,
          balances: rawMulBal.map((bal:any)=>parseBalanceReport(r.AcctOrErr.Acct.Ccy, bal)),
        }
        if (report.balances.length === 0) {
          throw new InvalidStructureError("Invalid CAMT.004 document: missing MulBal in Acct");
        }
      } else if (r.AcctOrErr?.BizErr) {
        // business error
        error = parseBusinessError(r.AcctOrErr.BizErr);
      } else {
        throw new InvalidStructureError("Invalid CAMT.004 document: missing AcctOrErr");
      }
      return { accountId, report, error };
    });

    return new CashManagementReturnAccount({
      header,
      reports,
    });
  }

  static fromXML(xml: string): CashManagementReturnAccount {
    const parser = XML.getParser();
    const doc = parser.parse(xml);

    if (!doc.Document) {
      throw new Error("Invalid XML format");
    }

    const namespace = (doc.Document['@_xmlns'] || doc.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.004.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.004 namespace');
    }
    return CashManagementReturnAccount.fromDocumentOject(doc);
  }

  static fromJSON(json: string): CashManagementReturnAccount {
    const obj = JSON.parse(json);

    if (!obj.Document) {
      throw new Error("Invalid JSON format");
    }

    return CashManagementReturnAccount.fromDocumentOject(obj);
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
      RtrAcct: {
        MsgHdr: exportMessageHeader(this._data.header),
        RptOrErr: {
          AcctRpt: this._data.reports.map((report) => {
            const obj: any = {
              AcctId: exportAccountIdentification(report.accountId),
              AcctOrErr: { }, // filled below
            };
            if (report.report) {
              obj.AcctOrErr.Acct = {
                Ccy: report.report.currency,
                Nm: report.report.name,
                Tp: { Cd: report.report.type }, // TODO add Prtry handling
                MulBal: report.report.balances.map((bal) => exportBalanceReport(report.report!.currency, bal)),
              };
            } else if (report.error) {
              obj.AcctOrErr.BizErr = exportBusinessError(report.error);
            }

            return obj;
          })
        }
      }
    };
    return { Document };
  }
}

registerISO20022Implementation(CashManagementReturnAccount);