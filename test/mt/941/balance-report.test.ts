import { BalanceReportMessage } from '../../../src/mt/941/balance-report';
import { InvalidFormatError, InvalidCurrencyConsistencyError } from '../../../src/errors';

describe('BalanceReportMessage', () => {
  describe('fromMT941', () => {
    let rawMT941: string;
    let report: BalanceReportMessage;

    describe('with a valid MT 941 message', () => {
      beforeEach(() => {
        // Sample MT 941 message with all fields
        rawMT941 = `:20:234567
:21:765432
:25:6894-77381
:28:212
:62F:C090604EUR659851,95
:64:C090604EUR480525,87
:65:C090605EUR530691,95`;
        report = BalanceReportMessage.fromMT941(rawMT941);
      });

      it('should create an instance with valid config', () => {
        expect(report).toBeInstanceOf(BalanceReportMessage);
        expect(report.transactionReferenceNumber).toBe('234567');
        expect(report.relatedReference).toBe('765432');
        expect(report.accountIdentification).toBe('6894-77381');
        expect(report.statementNumber).toBe('212');
        expect(report.dateTimeIndication).toBeUndefined();
        expect(report.openingBalance).toBeUndefined();
        expect(report.debitEntries).toBeUndefined();
        expect(report.creditEntries).toBeUndefined();

        // Check book balance
        expect(report.bookBalance).toBeDefined();
        expect(report.bookBalance.creditDebitIndicator).toBe('C');
        expect(report.bookBalance.date).toBeInstanceOf(Date);
        expect(report.bookBalance.currency).toBe('EUR');
        expect(report.bookBalance.amount).toBe(65985194); // 659851.95 in minor units

        // Check closing available balance
        expect(report.closingAvailableBalance).toBeDefined();
        if (report.closingAvailableBalance) {
          expect(report.closingAvailableBalance.creditDebitIndicator).toBe('C');
          expect(report.closingAvailableBalance.date).toBeInstanceOf(Date);
          expect(report.closingAvailableBalance.currency).toBe('EUR');
          expect(report.closingAvailableBalance.amount).toBe(48052587); // 480525.87 in minor units
        }

        // Check forward available balance
        expect(report.forwardAvailableBalance).toBeDefined();
        if (report.forwardAvailableBalance) {
          expect(report.forwardAvailableBalance.creditDebitIndicator).toBe('C');
          expect(report.forwardAvailableBalance.date).toBeInstanceOf(Date);
          expect(report.forwardAvailableBalance.currency).toBe('EUR');
          expect(report.forwardAvailableBalance.amount).toBe(53069194); // 530691.95 in minor units
        }

        expect(report.informationToAccountOwner).toBeUndefined();
      });
    });

    describe('with a minimal valid MT 941 message', () => {
      beforeEach(() => {
        // Sample MT 941 message with only required fields
        rawMT941 = `:20:REFERENCE123
:25:ACCOUNT123456
:28:12345
:62F:C230430USD2000,00`;
        report = BalanceReportMessage.fromMT941(rawMT941);
      });

      it('should create an instance with valid config', () => {
        expect(report).toBeInstanceOf(BalanceReportMessage);
        expect(report.transactionReferenceNumber).toBe('REFERENCE123');
        expect(report.relatedReference).toBeUndefined();
        expect(report.accountIdentification).toBe('ACCOUNT123456');
        expect(report.statementNumber).toBe('12345');
        expect(report.dateTimeIndication).toBeUndefined();
        expect(report.openingBalance).toBeUndefined();
        expect(report.debitEntries).toBeUndefined();
        expect(report.creditEntries).toBeUndefined();

        // Check book balance
        expect(report.bookBalance).toBeDefined();
        expect(report.bookBalance.creditDebitIndicator).toBe('C');
        expect(report.bookBalance.date).toBeInstanceOf(Date);
        expect(report.bookBalance.currency).toBe('USD');
        expect(report.bookBalance.amount).toBe(2000_00); // 2000.00 in minor units

        expect(report.closingAvailableBalance).toBeUndefined();
        expect(report.forwardAvailableBalance).toBeUndefined();
        expect(report.informationToAccountOwner).toBeUndefined();
      });
    });

    describe('with an invalid MT 941 message', () => {
      it('should throw an error for missing required fields', () => {
        // Missing Transaction Reference Number (20)
        rawMT941 = `:25:ACCOUNT123456
:28:12345
:62F:C230430USD2000,00`;
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow(InvalidFormatError);
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow('Missing required field: Transaction Reference Number (20)');

        // Missing Account Identification (25)
        rawMT941 = `:20:REFERENCE123
:28:12345
:62F:C230430USD2000,00`;
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow(InvalidFormatError);
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow('Missing required field: Account Identification (25)');

        // Missing Statement Number (28)
        rawMT941 = `:20:REFERENCE123
:25:ACCOUNT123456
:62F:C230430USD2000,00`;
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow(InvalidFormatError);
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow('Missing required field: Statement Number (28)');

        // Missing Book Balance (62F)
        rawMT941 = `:20:REFERENCE123
:25:ACCOUNT123456
:28:12345`;
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow(InvalidFormatError);
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow('Missing required field: Book Balance (62F)');
      });

      it('should throw an error for inconsistent currency codes', () => {
        // Inconsistent currency codes
        rawMT941 = `:20:REFERENCE123
:25:ACCOUNT123456
:28:12345
:60F:C230430USD1000,00
:90D:00005EUR500,00
:62F:C230430USD2000,00`;
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow(InvalidCurrencyConsistencyError);
        expect(() => BalanceReportMessage.fromMT941(rawMT941)).toThrow('Currency codes in fields 60F, 90D, 90C, 62F, 64, and 65 must have the same first two characters');
      });
    });
  });
});
