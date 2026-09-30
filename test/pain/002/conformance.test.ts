import { PaymentStatusReport } from '../../../src/pain/002/payment-status-report';
import { PaymentStatusCode } from '../../../src/pain/002/types';
import libxmljs from 'libxmljs';
import fs from 'fs';

describe('PAIN.002 conformance', () => {
  const xsd = libxmljs.parseXml(fs.readFileSync(`${process.cwd()}/schemas/pain/pain.002.001.14.xsd`, 'utf8'));
  const xml = fs.readFileSync(`${process.cwd()}/test/assets/synthetic/pain_002_001_14_sample.xml`, 'utf8');

  const assertValid = (doc: string): void => {
    const parsed = libxmljs.parseXml(doc);
    if (!parsed.validate(xsd)) {
      throw new Error(parsed.validationErrors.map((e) => e.message.trim()).join('\n'));
    }
  };

  it('fixture validates against pain.002.001.14', () => assertValid(xml));

  it('uses the ISO external codes for partial acceptance and credit settlement', () => {
    expect(PaymentStatusCode.PartiallyAccepted).toBe('PART');
    expect(PaymentStatusCode.AcceptedCreditSettlementCompleted).toBe('ACCC');
    expect(PaymentStatusCode.Pending).toBe('PDNG');
  });

  it('passes PART and ACCC through instead of throwing, and reads every reason block', () => {
    const report = PaymentStatusReport.fromXML(xml);
    expect(report.initatingParty?.name).toBe('Goldman Sachs Bank USA');
    expect(report.statusInformations).toEqual([
      {
        type: 'group', originalMessageId: 'PAIN001-0001', status: 'PART',
        reason: { code: 'NARR', additionalInformation: 'Group partially accepted\nSee transaction statuses\nSecond reason block' },
      },
      { type: 'payment', originalPaymentId: 'PMTINF-0001', status: 'PART', reason: { code: 'PMT-PARTIAL' } },
      {
        type: 'transaction', originalEndToEndId: 'E2E-0001', status: 'ACCC',
        reason: { code: 'AC01', additionalInformation: 'Transaction-level additional info' },
      },
      {
        type: 'transaction', originalEndToEndId: 'E2E-0002', status: 'RJCT',
        reason: { code: 'AC04', additionalInformation: 'Closed account\nSecond rejection detail' },
      },
    ]);
  });

  it('parses a header without the optional InitgPty', () => {
    const noParty = xml.replace(/<InitgPty>[\s\S]*?<\/InitgPty>/, '');
    assertValid(noParty);
    expect(PaymentStatusReport.fromXML(noParty).initatingParty).toBeUndefined();
  });

  it('still rejects a status that is not a 1–4 character code', () => {
    expect(() => PaymentStatusReport.fromXML(xml.replace('<GrpSts>PART</GrpSts>', '<GrpSts>TOOLONG</GrpSts>'))).toThrow(/Invalid status/);
  });
});
