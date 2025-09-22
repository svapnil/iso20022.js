import { CashManagementEndOfDayReport } from '../../../src/camt/053/cash-management-end-of-day-report';
import fs from 'fs';

describe('CashManagementEndOfDayReport', () => {
  describe('from XML and JSON', () => {
    let filePath: string;
    let report: CashManagementEndOfDayReport;

    describe('with a Goldman Sachs 053 v2 US file', () => {
      function checkStatementReport() {
        expect(report.messageId).toBe('235549650');
        expect(report.creationDate).toBeInstanceOf(Date);
        expect(report.recipient).toEqual({
          id: 'test001',
          name: 'Test Client Ltd.',
        });
        expect(report).toBeInstanceOf(CashManagementEndOfDayReport);

        // Synthetic methods (map reduced)
        expect(report.statements.length).toBe(1);
        expect(report.transactions.length).toBe(15);
        expect(report.entries.length).toBe(15);
        expect(report.balances.length).toBe(4);

        // Statement is correct
        const statement = report.statements[0];
        expect(statement.id).toBe('258158850');
        expect(statement.creationDate).toBeInstanceOf(Date);
        expect(statement.electronicSequenceNumber).toBe(1);
        expect(statement.legalSequenceNumber).toBe(1);
        expect(statement.fromDate).toBeInstanceOf(Date);
        expect(statement.toDate).toBeInstanceOf(Date);
        expect(statement.numOfEntries).toBe(14);
        expect(statement.sumOfEntries).toBe(140);
        expect(statement.netAmountOfEntries).toBe(40_00);
        expect(statement.account).toEqual({
          accountNumber: 'DD01100056869',
          currency: 'USD',
          name: 'Sample Name 123',
        });
        expect(statement.agent).toEqual({
          bic: 'GSCRUS30',
        });

        // Balances
        expect(statement.balances.length).toBe(4);
        const firstBalance = statement.balances[0];
        expect(firstBalance.amount).toBe(843686_20);
        expect(firstBalance.currency).toBe('USD');
        expect(firstBalance.creditDebitIndicator).toBe('debit');
        expect(firstBalance.type).toBe('OPBD');
        expect(firstBalance.date).toBeInstanceOf(Date);

        // Entries

        // Expect some entries to be reversals
        const reversedEntries = statement.entries.filter(
          entry => entry.reversal,
        );
        expect(reversedEntries.length).toBe(3);

        expect(statement.entries.length).toBe(15);
        const firstEntry = statement.entries[0];
        expect(firstEntry.amount).toBe(10_00);
        expect(firstEntry.currency).toBe('USD');
        expect(firstEntry.creditDebitIndicator).toBe('credit');
        expect(firstEntry.proprietaryCode).toBe('ACH Credit Reject');
        expect(firstEntry.bookingDate).toBeInstanceOf(Date);
        expect(firstEntry.bankTransactionCode.proprietaryCode).toBe(
          'ACH Credit Reject',
        );

        // Currently, we flatten entry details into a list of transactions
        expect(firstEntry.transactions.length).toBe(1);
        const firstTransaction = firstEntry.transactions[0];
        expect(firstTransaction.messageId).toBe('GSNULXSKMMJ479NMKS');
        expect(firstTransaction.accountServicerReferenceId).toBe(
          'B20092800002225',
        );
        expect(firstTransaction.paymentInformationId).toBe(
          'RP/GS/CTFILERP0002/CTBA0003',
        );
        expect(firstTransaction.endToEndId).toBe('GSGWGDNCTAHQM8');

        // Account Information
        expect(firstTransaction.remittanceInformation).toBe(
          'Sample Unstructured Remittance 123',
        );
        expect(firstTransaction.returnAdditionalInformation).toBe(
          'Status changed to REJECTED : REJECT REVERSAL',
        );

        // Transaction with a Creditor
        const transactionWithCreditor = report.transactions.find(
          t => t.messageId === 'ntsub_Of6teoIeoK9HKo',
        );
        expect(transactionWithCreditor).toBeDefined();
        expect(transactionWithCreditor?.creditor).toEqual({
          name: 'ABC INC',
          account: {
            accountNumber: '4356695007',
          },
          agent: {
            bic: 'WFBIUS6S',
          },
        });

        // Transaction with a Debtor
        const transactionWithDebtor = report.transactions.find(
          t => t.messageId === '20210706MMQFMPU700000106301050FT03',
        );
        expect(transactionWithDebtor).toBeDefined();
        expect(transactionWithDebtor?.debtor).toEqual({
          name: 'OPY USA INC.',
          account: {
            accountNumber: '107049932',
            currency: 'USD',
          },
          agent: {
            bic: 'GSCRUS33',
          },
        });
      }
      it('should create an instance with valid config from XML', () => {
        filePath = `${process.cwd()}/test/assets/goldman_sachs/camt_053_us_v2_sample.xml`;
        const camt053V2Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);

        checkStatementReport();

        // Generate a json object for the JSON parsing test
        const json = report.toJSON();
        fs.writeFileSync(filePath.replace('.xml', '.json'), JSON.stringify(json, null, 2), "utf8");
        
        // Generate XML from object for testing the serialize method
        const xml = report.serialize();
        fs.writeFileSync(filePath.replace('.xml', '.out.xml'), xml, "utf8");

      });
      it('should create an instance with valid config from JSON', () => {
        filePath = `${process.cwd()}/test/assets/goldman_sachs/camt_053_us_v2_sample.json`;
        const camt053V2Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromJSON(camt053V2Sample);

        checkStatementReport();


      });
    });

    describe('with the first Goldman Sachs 053 v2 UK file', () => {
      it('should create an instance with valid config', () => {
        filePath = `${process.cwd()}/test/assets/goldman_sachs/camt_053_uk_v2_1.xml`;
        const camt053V2Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);
        expect(report.messageId).toBe('9184021900');
      });
    });

    describe('with the second Goldman Sachs 053 v2 UK file', () => {
      it('should create an instance with valid config', () => {
        filePath = `${process.cwd()}/test/assets/goldman_sachs/camt_053_uk_v2_2.xml`;
        const camt053V2Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);
        expect(report.messageId).toBe('9184021900');
      });
    });

    describe('with a Goldman Sachs 053 v2 UK file with virtual accounts', () => {
      it('should create an instance with valid config', () => {
        filePath = `${process.cwd()}/test/assets/goldman_sachs/camt_053_uk_v2_virtual_accounts.xml`;
        const camt053V2Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);
        expect(report.messageId).toBe('9184021900');
      });
    });

    describe('with a Nordea 053 v2 file', () => {
      it('should create an instance with valid config', () => {
        filePath = `${process.cwd()}/test/assets/nordea/example_camt.xml`;
        const camt053V2Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);
        expect(report.messageId).toBe('XML12345678901234567890123456789012');

        // First balance parses file (Dt)
        const firstBalance = report.statements[0].balances[0];
        expect(firstBalance.date).toEqual(new Date('2019-05-08'));
      });
    });

    describe('with a ABN AMRO 053 NL file', () => {
      it('should create an instance with valid config', () => {
        filePath = `${process.cwd()}/test/assets/abn_amro/example_camt.xml`;
        const camt053Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053Sample);
        expect(report.messageId).toBe('0574908765.2013-04-02');
        expect(report.entries.length).toBe(13);

        // First balance parses file (Dt)
        const firstBalance = report.statements[0].balances[0];
        expect(firstBalance.date).toEqual(new Date('2013-03-28'));

        const [firstEntry] = report.entries;

        expect(firstEntry.referenceId).toBeUndefined();
        expect(firstEntry.creditDebitIndicator).toBe('credit');
        expect(firstEntry.reversal).toBe(false);
        expect(firstEntry.bookingDate).toEqual(new Date('2013-04-02'));
        expect(firstEntry.amount).toBe(100);
        expect(firstEntry.currency).toBe('EUR');
        expect(firstEntry.proprietaryCode).toBe('N196');
        expect(firstEntry.transactions.length).toBe(0);
        expect(firstEntry.additionalInformation).toBe(
          '11.11.111.111 Naam Adres 7 2960 Dorp',
        );
        expect(firstEntry.accountServicerReferenceId).toBe(
          '2102830989503100038',
        );
        expect(firstEntry.bankTransactionCode).toEqual({
          domainCode: 'PMNT',
          domainFamilyCode: 'RCDT',
          domainSubFamilyCode: 'NTAV',
          proprietaryCode: 'N196',
          proprietaryCodeIssuer: 'ABNAMRO',
        });
      });
    });

    describe('with an ING 053 NL file', () => {
      it('should create an instance with valid config', () => {
        filePath = `${process.cwd()}/test/assets/ing/example_camt.xml`;
        const camt053Sample = fs.readFileSync(filePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053Sample);
        expect(report.messageId).toBe('201401030009999_20140104015504378');
        expect(report.entries.length).toBe(9);

        // First balance parses file (Dt)
        const firstBalance = report.statements[0].balances[0];
        expect(firstBalance.date).toEqual(new Date('2014-01-02'));

        const [firstEntry] = report.entries;

        expect(firstEntry.referenceId).toBe('011111333306999888000000008');
        expect(firstEntry.creditDebitIndicator).toBe('credit');
        expect(firstEntry.reversal).toBe(false);
        expect(firstEntry.bookingDate).toEqual(new Date('2014-01-03'));
        expect(firstEntry.amount).toBe(35000);
        expect(firstEntry.currency).toBe('EUR');
        expect(firstEntry.proprietaryCode).toBe('00100');
        expect(firstEntry.transactions.length).toBe(1);
        expect(firstEntry.additionalInformation).toBeUndefined();
        expect(firstEntry.accountServicerReferenceId).toBe('59999208N9');
        expect(firstEntry.bankTransactionCode).toEqual({
          domainCode: 'PMNT',
          domainFamilyCode: 'RCDT',
          domainSubFamilyCode: 'ESCT',
          proprietaryCode: '00100',
          proprietaryCodeIssuer: 'INGGroup',
        });
      });
    });

    describe('with a non-XML file', () => {
      it('should throw an error', () => {
        expect(() => {
          CashManagementEndOfDayReport.fromXML('HELLO!!');
        }).toThrow('Invalid XML format');
      });
    });
  });


  describe('with a non-CAMT 053 XML file', () => {
    it('should throw an error', () => {
      expect(() => {
        const xmlFilePath = `${process.cwd()}/test/assets/cross_river/pain_002_transaction_rejected.xml`;
        const pain002Sample = fs.readFileSync(xmlFilePath, 'utf8');
        CashManagementEndOfDayReport.fromXML(pain002Sample);
      }).toThrow('Invalid CAMT.053 namespace');
    });
  });
});
