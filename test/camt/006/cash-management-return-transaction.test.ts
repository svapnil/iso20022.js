import { BalanceTypeCode } from '../../../src/camt/types';
import { CashManagementReturnTransaction } from '../../../src/camt/006/cash-management-return-transaction';
import fs from 'fs';

describe('CashManagementReturnAccount', () => {
  describe('from JSON', () => {
    it('should parse a valid CAMT.006 message with multiple Tx', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.006.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementReturnTransaction.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementReturnTransaction);
      expect(message.data.header.id).toBe('PTCDEFGHIXXX1202104120040299872243');
      expect(message.data.header.creationDateTime?.toISOString()).toBe(
        '2024-04-22T13:47:44.413Z',
      );
      expect(message.data.header.originalMessageHeader).toBeDefined();
      expect(message.data.header.originalMessageHeader?.id).toBe(
        'ABCDEFGHIXXX1202104120040297654321',
      );
      expect(message.data.reports).toHaveLength(2);
      expect(message.data.reports[0].paymentId).toBeDefined();
      expect(message.data.reports[0].paymentId?.endToEndId).toEqual('E2E1242435245345');
      expect(message.data.reports[0].paymentId?.currency).toEqual('EUR');
      expect(message.data.reports[0].paymentId?.amount).toEqual(9000); // 90.00 EUR
      expect(message.data.reports[0].report).toBeDefined();
      expect(message.data.reports[0].report?.status?.code).toEqual('Sttlm:ACCC');
      expect(message.data.reports[0].report?.debtor?.id).toEqual('02345678941');
      expect(message.data.reports[0].report?.debtorAgent).toBeDefined();
      if ( "bic" in message.data.reports[0].report?.debtorAgent!) {
        expect(message.data.reports[0].report?.debtorAgent?.bic).toEqual('AGRIFRPPXXX');
      }
      expect(message.data.reports[0].report?.creditor?.id).toEqual('02345678943');
      expect(message.data.reports[0].report?.creditorAgent).toBeDefined();
      if ( "bic" in message.data.reports[0].report?.creditorAgent!) {
        expect(message.data.reports[0].report?.creditorAgent?.bic).toEqual('BNPAFRPPXXX');
      }

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementReturnTransaction.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'PTCDEFGHIXXX1202104120040299872243',
      );
    });

  });
});
