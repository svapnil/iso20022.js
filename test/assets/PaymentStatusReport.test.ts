import { PaymentStatusReport } from '../../src/pain/002/PaymentStatusReport';
import fs from 'fs';

describe('PaymentStatusReport', () => {
  describe('fromXML', () => {
    let xmlFilePath: string;
    let report: PaymentStatusReport;

    describe('with a Goldman Sachs 002 Txn Status Report', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_pain_002_v3_accepted.xml`;
        const pain002Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = PaymentStatusReport.fromXML(pain002Sample);

        expect(report.messageId).toBe('1036XXX');
        expect(report.creationDate).toBeInstanceOf(Date);
        expect(report.initatingParty).toEqual({
          name: 'Goldman Sachs Bank',
        });
        expect(report.originalMessageId).toEqual('10280093XXXX');
        expect(report).toBeInstanceOf(PaymentStatusReport);
        expect(report.statuses).toHaveLength(1);
      });
    });

    describe('with a Goldman Sachs 002 Group Status Report', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_pain_002_v3_group_accepted.xml`;
        const pain002Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = PaymentStatusReport.fromXML(pain002Sample);
        expect(report.statuses).toHaveLength(1);
        expect(report.statuses[0].type).toEqual('group');
        expect(report.statuses[0].status).toEqual(
          'acceptedTechnicalValidation',
        );
        expect(report.statuses[0].reason?.additionalInformation).toEqual(
          'File accepted post technical and profile validations\nOriginal File Name: 26951.json',
        );
      });
    });

    describe('with a Goldman Sachs 002 Payment Status Report', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_pain_002_v3_payment_accepted.xml`;
        const pain002Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = PaymentStatusReport.fromXML(pain002Sample);
        expect(report.statuses).toHaveLength(1);
        expect(report.statuses[0].type).toEqual('payment');
        expect(report.status).toEqual('accepted');
      });
    });
  });
});