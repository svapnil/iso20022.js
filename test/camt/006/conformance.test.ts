import { CashManagementReturnTransaction } from '../../../src/camt/006/cash-management-return-transaction';
import libxmljs from 'libxmljs';
import fs from 'fs';

/**
 * camt.006 against its schema. Before this suite the parser had only ever seen
 * its own serializer output (stamped with the camt.004 namespace); this fixture
 * is validated against camt.006.001.11 before anything is asserted.
 */
describe('CAMT.006 conformance', () => {
  const xsd = libxmljs.parseXml(fs.readFileSync(`${process.cwd()}/schemas/camt/camt.006.001.11.xsd`, 'utf8'));
  const xml = fs.readFileSync(`${process.cwd()}/test/assets/synthetic/camt_006_001_11_sample.xml`, 'utf8');

  const assertValid = (doc: string): void => {
    const parsed = libxmljs.parseXml(doc);
    if (!parsed.validate(xsd)) {
      throw new Error(`Does not validate against camt.006.001.11:\n${parsed.validationErrors.map((e) => e.message.trim()).join('\n')}`);
    }
  };

  const EXPECTED = {
    header: { id: 'RTRTX-0001', creationDateTime: expect.any(Date) },
    reports: [
      {
        paymentId: {
          identifierType: 'LngBizId',
          currency: 'EUR',
          amount: 829,
          settlementDate: expect.any(Date),
          instructingAgent: { bic: 'COBADEFFXXX' },
          instructedAgent: { bic: 'GSCRUS30XXX' },
          endToEndId: 'E2E-0001',
          transactionId: 'TX-0001',
        },
        report: {
          msgId: 'PMT-MSG-0001',
          reqExecutionDate: new Date('2026-03-01T14:30:00.000Z'),
          status: { code: 'Prtry:CUST', reason: 'Umtchd:DMON' },
          debtor: { name: 'ACME Supplies GmbH', id: 'ACME-001' },
          debtorAgent: { bic: 'COBADEFFXXX' },
          creditorAgent: { abaRoutingNumber: '021000021' },
          creditor: { name: 'Test Client Ltd.', id: 'test001' },
        },
      },
      {
        paymentId: {
          identifierType: 'ShrtBizId',
          uetr: '1b7e4a2c-3d5f-4a6b-8c9d-0e1f2a3b4c5d',
          settlementDate: expect.any(Date),
          instructingAgent: { bic: 'DEUTDEFFXXX' },
        },
        report: {
          reqExecutionDate: new Date('2026-03-02'),
          status: { code: 'Fnl:STLD', reason: 'BANK-REJ' },
          debtor: { agent: { bic: 'DEUTDEFFXXX' } },
          creditor: { name: 'Beneficiary Co' },
        },
      },
    ],
  };

  it('fixture validates against camt.006.001.11', () => assertValid(xml));

  it('accepts the camt.006 namespace and parses a conformant document', () => {
    const data = CashManagementReturnTransaction.fromXML(xml).data;
    expect(data).toMatchObject(EXPECTED);
    // ShrtBizId carries no amount, and no currency was given anywhere for it
    expect(data.reports[1].paymentId.amount).toBeUndefined();
    expect(data.reports[1].paymentId.currency).toBeUndefined();
  });

  it('serializes to a document that validates against the schema and round-trips', () => {
    const out = CashManagementReturnTransaction.fromXML(xml).serialize();
    expect(out).toContain('xmlns="urn:iso:std:iso:20022:tech:xsd:camt.006.001.11"');
    assertValid(out);
    expect(CashManagementReturnTransaction.fromXML(out).data).toMatchObject(EXPECTED);
  });

  it('still reads the pre-conformance {Amt, Ccy} dialect from JSON', () => {
    const legacy = { Document: { RtrTx: { MsgHdr: { MsgId: 'M' }, RptOrErr: { BizRpt: { TxRpt: {
      PmtId: { LngBizId: { IntrBkSttlmAmt: { Amt: 90.0, Ccy: 'EUR' }, EndToEndId: 'E2E' } },
      TxOrErr: { Tx: { Pmt: { Sts: { Cd: { Sttlm: 'ACCC' } } } } },
    } } } } } };
    const { paymentId, report } = CashManagementReturnTransaction.fromJSON(JSON.stringify(legacy)).data.reports[0];
    expect(paymentId).toMatchObject({ identifierType: 'LngBizId', currency: 'EUR', amount: 9000, endToEndId: 'E2E' });
    expect(report?.status).toEqual({ code: 'Sttlm:ACCC', reason: undefined });
  });

  it('rejects a document in another message namespace', () => {
    expect(() => CashManagementReturnTransaction.fromXML(xml.replace('xmlns="urn:iso:std:iso:20022:tech:xsd:camt.006.001.11"', 'xmlns="urn:iso:std:iso:20022:tech:xsd:camt.004.001.02"'))).toThrow(/namespace/i);
  });
});
