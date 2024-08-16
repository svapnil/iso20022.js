import { CashManagementEndOfDayReport } from '../../../src/camt/053/CashManagementEndOfDayReport';
import fs from 'fs';

describe('CashManagementEndOfDayReport', () => {
  describe('fromXML', () => {
    let xmlFilePath: string;
    let report: CashManagementEndOfDayReport;

    describe('with a Goldman Sachs 053 v2 US file', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_camt_053_us_v2_sample.xml`;
        const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);

        expect(report.messageId).toBe('235549650');
        expect(report.creationDate).toBeInstanceOf(Date);
        expect(report.recipient).toEqual({
          id: 'test001',
          name: 'Test Client Ltd.',
        });
        expect(report).toBeInstanceOf(CashManagementEndOfDayReport);

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
        expect(statement.netAmountOfEntries).toBe(40);
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
        expect(firstBalance.amount).toBe(843686.2);
        expect(firstBalance.currency).toBe('USD');
        expect(firstBalance.creditDebitIndicator).toBe('debit');
        expect(firstBalance.type).toBe('OPBD');

        // Entries
        expect(statement.entries.length).toBe(15);
        const firstEntry = statement.entries[0];
        expect(firstEntry.amount).toBe(10);
        expect(firstEntry.currency).toBe('USD');
        expect(firstEntry.creditDebitIndicator).toBe('credit');
        expect(firstEntry.proprietaryCode).toBe('ACH Credit Reject');

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
      });
    });

    describe('with the first Goldman Sachs 053 v2 UK file', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_camt_053_uk_v2_1.xml`;
        const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);
        expect(report.messageId).toBe('9184021900');
      });
    });

    describe('with the second Goldman Sachs 053 v2 UK file', () => {
      it('should create an instance with valid config', () => {
        xmlFilePath = `${process.cwd()}/test/assets/gs_camt_053_uk_v2_2.xml`;
        const camt053V2Sample = fs.readFileSync(xmlFilePath, 'utf8');
        report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);
        expect(report.messageId).toBe('9184021900');
      });
    });
  });
});
