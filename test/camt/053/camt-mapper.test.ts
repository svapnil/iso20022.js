import fs from 'fs';
import { CamtToBondMapper } from '../../../src/camt/camt-to-bond.mapper';

describe('CamtToBondMapper', () => {
  describe('parse mercury files', () => {
    let xmlFilePath: string;

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

  describe('parse bom files', () => {
    let xmlFilePath: string;

    it('should parse a valid camt053_v2_4.xml file', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      xmlFilePath = `${process.cwd()}/test/assets/bank_of_montreal/camt053_v2_4.xml`;
      const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
      const mapper = new CamtToBondMapper();
      const accounts = mapper.parse(camt053V2Sample);
      expect(accounts).toBeDefined();
      expect(accounts.length).toBe(14);
      // Count console.warn calls with "- Field"
      const fieldWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0].toString().startsWith('- Field')
      ).length;
      expect(fieldWarnings).toBe(0);
      consoleWarnSpy.mockRestore();
    });

    it('should parse a valid camt053_v2_5.xml file', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      xmlFilePath = `${process.cwd()}/test/assets/bank_of_montreal/camt053_v2_5.xml`;
      const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
      const mapper = new CamtToBondMapper();
      const accounts = mapper.parse(camt053V2Sample);
      expect(accounts).toBeDefined();
      expect(accounts.length).toBe(14);
      // Count console.warn calls with "- Field"
      const fieldWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0].toString().startsWith('- Field')
      ).length;
      expect(fieldWarnings).toBe(2);
      consoleWarnSpy.mockRestore();
    });
    
    it('should generate synthetic references when original references are missing', () => {
      xmlFilePath = `${process.cwd()}/test/assets/bank_of_montreal/camt053_v2_5.xml`;
      const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
      const mapper = new CamtToBondMapper();
      const accounts = mapper.parse(camt053V2Sample);
      
      // Get all transactions from all accounts
      const allTransactions = accounts.flatMap(account => account.transactions || []);
      
      // Check that all transactions have a reference
      expect(allTransactions.every(transaction => transaction.reference)).toBe(true);
      
      // Find any synthetic references (starting with SYN_)
      const syntheticReferences = allTransactions.filter(transaction => 
        transaction.reference.startsWith('SYN_')
      );
      
      // Verify the format of synthetic references
      syntheticReferences.forEach(transaction => {
        const reference = transaction.reference;
        // Format should be SYN_accountIdentifier_date_amount
        const parts = reference.split('_');
        expect(parts.length).toBeGreaterThanOrEqual(4);
        expect(parts[0]).toBe('SYN');
        
        // Verify date part is in YYYYMMDD format
        const datePart = parts[2];
        expect(datePart.length).toBe(8);
        expect(Number.isNaN(Number(datePart))).toBe(false);
        
        // Verify amount part is numeric (after removing any non-numeric chars)
        const amountPart = parts[3];
        expect(Number.isNaN(Number(amountPart.replace(/[^0-9]/g, '')))).toBe(false);
      });
    });
  });
});
