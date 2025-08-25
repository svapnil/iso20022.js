import { CashManagementEndOfDayReport } from '../../../src/camt/053/cash-management-end-of-day-report';
import fs from 'fs';
import { CamtToBondMapper } from '../../../src/camt/camt-to-bond.mapper';

describe('CamtToBondMapper', () => {
  describe('parse', () => {
    let xmlFilePath: string;
    let report: CashManagementEndOfDayReport;

    it('should parse a valid camt053_v2_1.xml file', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      xmlFilePath = `${process.cwd()}/test/assets/mercury/camt053_v2_1.xml`;
      const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
      const mapper = new CamtToBondMapper();
      const accounts = mapper.parse(camt053V2Sample);
      expect(accounts).toBeDefined();
      expect(accounts.length).toBe(38);
      const totalTransactions = accounts.reduce((acc, account) => acc + (account.transactions?.length || 0), 0);
      expect(totalTransactions).toBe(50);
      // Count console.warn calls with "- Field"
      const fieldWarnings = consoleWarnSpy.mock.calls.filter(call => 
        call[0].toString().startsWith('- Field')
      ).length;
      expect(fieldWarnings).toBe(0);
      consoleWarnSpy.mockRestore();
    });
  });
});
