import { CashManagementGetAccount } from '../../../src/camt/003/cash-management-get-account';
import fs from 'fs';

describe('CashManagementGetAccount', () => {
  describe('from JSON', () => {
    it('should parse a valid CAMT.003 message with criteria on Account ID', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.003.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementGetAccount.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementGetAccount);
      expect(message.data.header.id).toBe('ABCDEFGHIXXX1202104120040297654321');
      expect(message.data.header.creationDateTime?.toISOString()).toBe(
        '2021-09-28T13:41:47.123Z',
      );
      expect(message.data.newCriteria).toBeDefined();
      expect(message.data.newCriteria?.name).toBeUndefined();
      expect(message.data.newCriteria?.searchCriteria.length).toEqual(1);
      expect(message.data.newCriteria?.searchCriteria[0].accountEqualTo).toBeDefined();
      expect(message.data.newCriteria?.searchCriteria[0].accountEqualTo).toHaveProperty('id');
      if (message.data.newCriteria?.searchCriteria[0].accountEqualTo && 'id' in message.data.newCriteria?.searchCriteria[0].accountEqualTo) {
        // TypeScript type guard
        expect(message.data.newCriteria?.searchCriteria[0].accountEqualTo.id).toEqual('02345678943');
        expect(message.data.newCriteria?.searchCriteria[0].accountEqualTo.issuer).toEqual('AGRIFRPPXXX');
      }
      expect(message.data.newCriteria?.searchCriteria[0].currencyEqualTo).toEqual('USD');
      expect(message.data.newCriteria?.searchCriteria[0].balanceAsOfDateEqualTo).toEqual(new Date('2021-09-28'));

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementGetAccount.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'ABCDEFGHIXXX1202104120040297654321',
      );
    });

  });
});
