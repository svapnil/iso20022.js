import { PaymentStatusReport } from '../../src/pain/002/PaymentStatusReport';
import fs from 'fs';

describe('PaymentStatusReport', () => {
  describe('fromXML', () => {
    let xmlFilePath: string;
    let report: PaymentStatusReport;

    describe('with a Goldman Sachs 002 US file', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_pain_002_v3_accepted.xml`;
        const pain002Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = PaymentStatusReport.fromXML(pain002Sample);

        expect(report.messageId).toBe('1036XXX');
        expect(report.creationDate).toBeInstanceOf(Date);
        expect(report.initatingParty).toEqual({
          name: 'Goldman Sachs Bank',
        });
        expect(report.originalGroupInformation).toEqual({
          originalMessageId: '10280093XXXX',
        });
        expect(report).toBeInstanceOf(PaymentStatusReport);
      });
    });
  });
});
