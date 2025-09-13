import { InvalidStructureError, InvalidXmlNamespaceError } from "../../errors";
import { GenericISO20022Message, ISO20022Messages, ISO20022MessageTypeName, registerISO20022Implementation, XML } from "../../lib/interfaces";
import { AccountIdentification, MessageHeader } from "../../lib/types";
import { exportAccountIdentification, exportMessageHeader, parseAccountIdentification, parseDate, parseMessageHeader } from "../../parseUtils";


export interface CashManagementGetAccountCriterium {
  // Define the properties of a criterium here
  // For example, you might have:
  accountRegExp?: string; // regular expression to match account IDs
  accountEqualTo?: AccountIdentification; // exact account to match
  currencyEqualTo?: string; // exact currency to match
  balanceAsOfDateEqualTo?: Date; // balance as of date to match
}

export interface CashManagementGetAccountData {
  // Define the properties of the CAMT.003 message here
  header: MessageHeader;
  // For now only new criteria is supported
  newCriteria: {
    name: string;
    searchCriteria: CashManagementGetAccountCriterium[];
  };
}

export class CashManagementGetAccount implements GenericISO20022Message {
  private _data: CashManagementGetAccountData;

  constructor(data: CashManagementGetAccountData) {
    this._data = data;
  }

  get data(): CashManagementGetAccountData {
    return this._data;
  }

  static supportedMessages(): ISO20022MessageTypeName[] {
    return [ISO20022Messages.CAMT_003];
  }

  static fromDocumentOject(doc: any): CashManagementGetAccount {
    const rawHeader = doc.Document?.GetAcct?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError("Invalid CAMT.003 document: missing MsgHdr");
    }
    const header = parseMessageHeader(rawHeader);
      
    const newCrit = doc.Document?.GetAcct?.AcctQryDef?.AcctCrit?.NewCrit;
    if (!newCrit) {
      throw new InvalidStructureError("Invalid CAMT.003 document: missing GetAcct.AcctQryDef.AcctCrit.NewCrit");
    }

    const name = newCrit.NewQryNm;
    
    let searchCriteria: CashManagementGetAccountCriterium[] = [];
    let rawCriterias = newCrit.SchCrit;
    if (!Array.isArray(rawCriterias)) {
      rawCriterias = [rawCriterias];
    }
    rawCriterias = rawCriterias.filter((c: any) => !!c);
    if (rawCriterias.length === 0) {
      throw new InvalidStructureError("Invalid CAMT.003 document: missing search criteria");
    }

    for (const rawCriterium of rawCriterias) {
      const crit: CashManagementGetAccountCriterium = {};
      // search on Ids, only one criterium supported for now
      if (rawCriterium.AcctId) {
        if (Array.isArray(rawCriterium.AcctId) && rawCriterium.AcctId.length > 1) {
          throw new InvalidStructureError("Invalid CAMT.003 document: multiple AcctId criterium not supported");
        }
        const acctId = Array.isArray(rawCriterium.AcctId)? rawCriterium.AcctId[0] : rawCriterium.AcctId;
        if (acctId.CTTxt) {
          crit.accountRegExp = `.*${acctId.CTTxt}.*`; // contains
        } else if (acctId.NCTTxt) {
          crit.accountRegExp = `^((?!${acctId.NCTTxt}).)*$`; // does not contain
        } else if (acctId.EQ) {
          crit.accountEqualTo = parseAccountIdentification(acctId.EQ);
        }
      }
      // search on currency
      if (rawCriterium.Ccy) {
        if (Array.isArray(rawCriterium.Ccy) && rawCriterium.Ccy.length > 1) {
          throw new InvalidStructureError("Invalid CAMT.003 document: multiple Ccy criterium not supported");
        }
        const ccy = Array.isArray(rawCriterium.Ccy)? rawCriterium.Ccy[0] : rawCriterium.Ccy;
        crit.currencyEqualTo = ccy;
      }
      // search on balance as of date
      if (rawCriterium.Bal) {
        if (Array.isArray(rawCriterium.Bal) && rawCriterium.Bal.length > 1) {
          throw new InvalidStructureError("Invalid CAMT.003 document: multiple Bal criterium not supported");
        }
        const bal = Array.isArray(rawCriterium.Bal)? rawCriterium.Bal[0] : rawCriterium.Bal;
        if (bal?.ValDt && Array.isArray(bal.ValDt) && bal.ValDt.length > 1) {
          throw new InvalidStructureError("Invalid CAMT.003 document: multiple ValDt criterium not supported");
        }
        const valDt = Array.isArray(bal?.ValDt)? bal.ValDt[0] : bal?.ValDt;
        if (valDt?.Dt?.EQDt) {
          crit.balanceAsOfDateEqualTo = parseDate(valDt.Dt.EQDt);
        }
      }
      searchCriteria.push(crit);
    }
    

    return new CashManagementGetAccount({
      header,
      newCriteria: {
        name,
        searchCriteria,
      },
    });
  }

  static fromXML(xml: string): CashManagementGetAccount {
    const parser = XML.getParser();
    const doc = parser.parse(xml);

    if (!doc.Document) {
      throw new Error("Invalid XML format");
    }

    const namespace = (doc.Document['@_xmlns'] || doc.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.003.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.003 namespace');
    }
    return CashManagementGetAccount.fromDocumentOject(doc);
  }

  static fromJSON(json: string): CashManagementGetAccount {
    const obj = JSON.parse(json);

    if (!obj.Document) {
      throw new Error("Invalid JSON format");
    }

    return CashManagementGetAccount.fromDocumentOject(obj);
  }

  serialize(): string {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.003.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';

    return builder.build(obj);

  }
  toJSON(): any {
    // we should not have to serialize but we do it for consistency
    const Document: any = {
      GetAcct: {
        MsgHdr: exportMessageHeader(this._data.header),
        AcctQryDef: {
          AcctCrit: {
            NewCrit: {
              NewQryNm: this._data.newCriteria?.name,
              SchCrit: this._data.newCriteria?.searchCriteria.map((c) => {
                const obj: any = {};
                if (c.accountRegExp) {
                  if (c.accountRegExp.startsWith('.*') && c.accountRegExp.endsWith('.*')) {
                    obj.AcctId = { CTTxt: c.accountRegExp.replace(/^\.\*/, '').replace(/\.\*$/, '') }; // contains
                  } else if (c.accountRegExp.startsWith('^((?!') && c.accountRegExp.endsWith(').)*$')) {
                    obj.AcctId = { NCTTxt: c.accountRegExp.replace(/^\^\(\(\!\(/, '').replace(/\)\.\)\*\$$/, '') }; // does not contain
                  }
                } else if (c.accountEqualTo) {
                  obj.AcctId = { 
                    EQ: exportAccountIdentification(c.accountEqualTo)
                  }
                }
                if (c.currencyEqualTo) {
                  obj.Ccy = [c.currencyEqualTo];
                }
                if (c.balanceAsOfDateEqualTo) {
                  obj.Bal = [{
                    ValDt: [{
                      Dt: {
                        EQDt: c.balanceAsOfDateEqualTo.toISOString().slice(0,10)
                      }
                    }]
                  }];
                }
                return obj;
              }),
            }
          }
        }
      }
    };
    return { Document };
  }
}

registerISO20022Implementation(CashManagementGetAccount);