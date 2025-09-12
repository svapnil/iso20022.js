import { InvalidStructureError, InvalidXmlNamespaceError } from "../../errors";
import { GenericISO20022Message, XML } from "../../lib/interfaces";
import { MessageHeader } from "../../lib/types";
import { exportMessageHeader, parseDate, parseMessageHeader } from "../../parseUtils";

export interface CashManagementGetTransactionCriterium {
  // Define the properties of a criterium here
  // For example, you might have:
  type: string; // the tag name of the camt.005 
  msgIdsEqualTo?: string[]; // list of message IDs to match
  dateEqualTo?: Date;
  endToEndIdEqualTo?: string[];
}

export interface CashManagementGetTransactionData {
  // Define the properties of the CAMT.005 message here
  header: MessageHeader;
  // For now only new criteria is supported
  newCriteria?: {
    name?: string;
    searchCriteria: CashManagementGetTransactionCriterium[]; // At least one criterium is required
  };
}

export class CashManagementGetTransaction implements GenericISO20022Message {
  private _data: CashManagementGetTransactionData;

  constructor(data: CashManagementGetTransactionData) {
    this._data = data;
  }

  get data(): CashManagementGetTransactionData {
    return this._data;
  }

  static fromDocumentOject(doc: any): CashManagementGetTransaction {
    const rawHeader = doc.Document?.GetTx?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError("Invalid CAMT.005 document: missing MsgHdr");
    }
    const header = parseMessageHeader(rawHeader);
      
    const newCrit = doc.Document?.GetTx?.TxQryDef?.TxCrit?.NewCrit;
    if (!newCrit) {
      throw new InvalidStructureError("Invalid CAMT.005 document: missing GetTx.TxQryDef.TxCrit.NewCrit");
    }

    const name = newCrit.NewQryNm;
    
    let searchCriteria: CashManagementGetTransactionCriterium[] = [];
    let rawCriterias = newCrit.SchCrit;
    if (!Array.isArray(rawCriterias)) {
      rawCriterias = [rawCriterias];
    }
    rawCriterias = rawCriterias.filter((c: any) => !!c);
    if (rawCriterias.length === 0) {
      throw new InvalidStructureError("Invalid CAMT.005 document: missing search criteria");
    }

    for (const rawCriterium of rawCriterias) {
      // search on Ids
      if (rawCriterium.PmtSch.MsgId) {
        searchCriteria.push({
          type: "PmtSch.MsgId",
          msgIdsEqualTo: Array.isArray(rawCriterium.PmtSch.MsgId) ? rawCriterium.PmtSch.MsgId : [rawCriterium.PmtSch.MsgId],
        });
      }
      // seach on date
      if (rawCriterium.PmtSch.ReqdExctnDt) {
        if (Array.isArray(rawCriterium.PmtSch.ReqdExctnDt) && rawCriterium.PmtSch.ReqdExctnDt.length > 1) {
          throw new InvalidStructureError("Invalid CAMT.005 document: multiple ReqdExctnDt criterium not supported");
        }
        const criterium = Array.isArray(rawCriterium.PmtSch.ReqdExctnDt)? rawCriterium.PmtSch.ReqdExctnDt[0] : rawCriterium.PmtSch.ReqdExctnDt;
        if (criterium?.DtSch?.EQDt) {
          searchCriteria.push({
            type: "PmtSch.ReqdExctnDt",
            dateEqualTo: parseDate(criterium.DtSch.EQDt),
          });
        }
      }
      let pmtIds: any[] = Array.isArray(rawCriterium.PmtSch.PmtId) ? rawCriterium.PmtSch.PmtId : [rawCriterium.PmtSch.PmtId];
      pmtIds = pmtIds.filter((p) => !!p && p.LngBizId?.EndToEndId);
      if (pmtIds.length > 0) {
        searchCriteria.push({
          type: "PmtSch.PmtId.LngBizId.EndToEndId",
          endToEndIdEqualTo: pmtIds.map((id) => id.LngBizId.EndToEndId),
        });
      }
    }
    

    return new CashManagementGetTransaction({
      header,
      newCriteria: {
        name,
        searchCriteria,
      },
    });
  }

  static fromXML(xml: string): CashManagementGetTransaction {
    const parser = XML.getParser();
    const doc = parser.parse(xml);

    if (!doc.Document) {
      throw new Error("Invalid XML format");
    }

    const namespace = (doc.Document['@_xmlns'] || doc.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.005.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.005 namespace');
    }
    return CashManagementGetTransaction.fromDocumentOject(doc);
  }

  static fromJSON(json: string): CashManagementGetTransaction {
    const obj = JSON.parse(json);

    if (!obj.Document) {
      throw new Error("Invalid JSON format");
    }

    return CashManagementGetTransaction.fromDocumentOject(obj);
  }

  serialize(): string {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.005.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';

    return builder.build(obj);

  }
  toJSON(): any {
    // we should not have to serialize but we do it for consistency
    const Document: any = {
      GetTx: {
        MsgHdr: exportMessageHeader(this._data.header),
        TxQryDef: {
          TxCrit: {
            NewCrit: {
              NewQryNm: this._data.newCriteria?.name,
              SchCrit: this._data.newCriteria?.searchCriteria.map((c) => {
                const obj: any = {};
                if (c.type === "PmtSch.MsgId" && c.msgIdsEqualTo) {
                  obj.PmtSch = {
                    MsgId: c.msgIdsEqualTo
                  };
                }
                if (c.type === "PmtSch.ReqdExctnDt" && c.dateEqualTo) {
                  obj.PmtSch = {
                    ReqdExctnDt: {
                      DtSch: {
                        EQDt: c.dateEqualTo.toISOString().slice(0, 10),
                      }
                    }
                  };
                }
                if (c.type === "PmtSch.PmtId.LngBizId.EndToEndId" && c.endToEndIdEqualTo) {
                  obj.PmtSch = {
                    PmtId: c.endToEndIdEqualTo.map((id) => ({
                      LngBizId: {
                        EndToEndId: id,
                      }
                    }))
                  };
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