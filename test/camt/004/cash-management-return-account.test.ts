import { BalanceTypeCode } from '../../../src/camt/types';
import { CashManagementReturnAccount } from '../../../src/camt/004/cash-management-return-account';
import fs from 'fs';

describe('CashManagementReturnAccount', () => {
  describe('from JSON', () => {
    it('should parse a valid CAMT.004 message with multiple balances', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.004.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementReturnAccount.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementReturnAccount);
      expect(message.data.header.id).toBe('5ac6cf3224284559ba3b3bb667f9c00');
      expect(message.data.header.creationDateTime?.toISOString()).toBe(
        '2024-03-18T13:47:44.413Z',
      );
      expect(message.data.header.originalMessageHeader).toBeDefined();
      expect(message.data.header.originalMessageHeader?.id).toBe(
        '5ac6cf3224284559ba3b3bb667f9f589',
      );
      expect(message.data.reports.length).toBe(1);
      expect(message.data.reports[0].accountId).toHaveProperty('id');
      if (message.data.reports[0].accountId && 'id' in message.data.reports[0].accountId) {
        // TypeScript type guard
        expect(message.data.reports[0].accountId.id).toEqual('02345678943');
        expect(message.data.reports[0].accountId.issuer).toEqual('AGRIFRPPXXX');
      }
      expect(message.data.reports[0].error).toBeUndefined();
      expect(message.data.reports[0].report).toBeDefined();
      expect(message.data.reports[0].report?.currency).toBe('USD');
      expect(message.data.reports[0].report?.balances?.length).toEqual(5);
      // find the available balance
      const availableBalance = message.data.reports[0].report?.balances.find(bal => bal.type == BalanceTypeCode.ClosingAvailable);
      expect(availableBalance).toBeDefined();
      expect(availableBalance?.creditDebitIndicator).toEqual("credit");
      expect(availableBalance?.amount).toBe(143608);

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementReturnAccount.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        '5ac6cf3224284559ba3b3bb667f9c00',
      );
    });

  });
});
