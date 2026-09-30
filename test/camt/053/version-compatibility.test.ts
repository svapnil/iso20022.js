import { CashManagementEndOfDayReport } from '../../../src/camt/053/cash-management-end-of-day-report';
import libxmljs from 'libxmljs';
import fs from 'fs';

/**
 * The parser accepts any camt.053.001.* namespace but the rest of the suite
 * only exercises version 02 documents. These tests cover the structures that
 * changed in later versions and the schema-optional elements that a v02-only
 * sample never exercises.
 *
 * Every document parsed here is first validated against the shipped v12 XSD,
 * so a failing assertion always points at the parser rather than at a
 * hand-written fixture.
 */
describe('CAMT.053 version compatibility', () => {
  const v12Path = `${process.cwd()}/test/assets/synthetic/camt_053_001_12_sample.xml`;
  const v02Path = `${process.cwd()}/test/assets/goldman_sachs/camt_053_us_v2_sample.xml`;
  const xsdPath = `${process.cwd()}/schemas/camt/camt.053.001.12.xsd`;

  let v12Xml: string;
  let xsdDoc: ReturnType<typeof libxmljs.parseXml>;

  beforeAll(() => {
    v12Xml = fs.readFileSync(v12Path, 'utf8');
    xsdDoc = libxmljs.parseXml(fs.readFileSync(xsdPath, 'utf8'));
  });

  /** Asserts the document conforms to camt.053.001.12, surfacing libxml's errors on failure. */
  function assertValidV12(xml: string): void {
    const xmlDoc = libxmljs.parseXml(xml);
    const isValid = xmlDoc.validate(xsdDoc);
    if (!isValid) {
      const messages = xmlDoc.validationErrors.map((e) => e.message.trim());
      throw new Error(`Document does not validate against camt.053.001.12:\n${messages.join('\n')}`);
    }
  }

  describe('with a camt.053.001.12 document', () => {
    let report: CashManagementEndOfDayReport;

    beforeAll(() => {
      assertValidV12(v12Xml);
      report = CashManagementEndOfDayReport.fromXML(v12Xml);
    });

    it('parses the group header and statement metadata', () => {
      expect(report.messageId).toBe('V12-MSG-0001');
      expect(report.creationDate).toBeInstanceOf(Date);
      expect(report.recipient).toEqual({
        id: 'test001',
        name: 'Test Client Ltd.',
      });

      expect(report.statements.length).toBe(1);
      const statement = report.statements[0];
      expect(statement.id).toBe('V12-STMT-0001');
      expect(statement.electronicSequenceNumber).toBe(7);
      expect(statement.legalSequenceNumber).toBe(7);
      expect(statement.creationDate).toBeInstanceOf(Date);
      expect(statement.fromDate).toBeInstanceOf(Date);
      expect(statement.toDate).toBeInstanceOf(Date);
      expect(statement.numOfEntries).toBe(4);
    });

    it('reads the account and the BICFI-spelled account servicer', () => {
      const statement = report.statements[0];
      expect(statement.account).toEqual({
        accountNumber: 'DD01100056869',
        currency: 'USD',
        name: 'Operating Account',
      });
      expect(statement.agent).toEqual({ bic: 'GSCRUS30XXX' });
    });

    it('reads both branches of BalanceType10Choice', () => {
      const balances = report.statements[0].balances;
      expect(balances.map((b) => b.type)).toEqual(['OPBD', 'CLBD', 'CUSTBAL']);
      expect(balances.map((b) => b.amount)).toEqual([100000, 110281, 110281]);
      expect(balances.every((b) => b.date instanceof Date)).toBe(true);
    });

    it('rounds decimal amounts to the nearest minor unit', () => {
      // 8.29 * 100, 4.35 * 100 and 1.13 * 100 all land just below the integer in
      // binary floating point; flooring used to drop a cent from each of them.
      const amounts = report.statements[0].entries.map((e) => e.amount);
      expect(amounts).toEqual([829, 435, 113, 10000]);
    });

    it('reads counterparty names through the Party50Choice wrapper', () => {
      const tx = report.statements[0].entries[0].transactions[0];
      expect(tx.debtor?.name).toBe('ACME Supplies GmbH');
      expect(tx.debtor?.account).toEqual({ iban: 'DE89370400440532013000' });
      expect(tx.creditor?.name).toBe('Test Client Ltd.');
      expect(tx.creditor?.account).toEqual({ accountNumber: 'DD01100056869' });
    });

    it('reads BICFI on related agents', () => {
      const tx = report.statements[0].entries[0].transactions[0];
      expect(tx.debtor?.agent).toEqual({ bic: 'COBADEFFXXX' });
      expect(tx.creditor?.agent).toEqual({ bic: 'GSCRUS30XXX' });
    });

    it('reads references and the bank transaction code', () => {
      const entry = report.statements[0].entries[0];
      const tx = entry.transactions[0];
      expect(tx.messageId).toBe('PMT-MSG-0001');
      expect(tx.endToEndId).toBe('E2E-0001');
      expect(entry.bankTransactionCode).toEqual({
        domainCode: 'PMNT',
        domainFamilyCode: 'RCDT',
        domainSubFamilyCode: 'ESCT',
        proprietaryCode: 'SEPA-IN',
        proprietaryCodeIssuer: 'GS',
      });
    });

    it('leaves bookingDate undefined for a pending entry with no BookgDt', () => {
      const pending = report.statements[0].entries[1];
      expect(pending.referenceId).toBe('E2-PENDING-DEBIT');
      expect(pending.creditDebitIndicator).toBe('debit');
      expect(pending.bookingDate).toBeUndefined();
      expect(pending.transactions).toEqual([]);
    });

    it('folds repeated Ustrd lines into one remittance string', () => {
      const tx = report.statements[0].entries[0].transactions[0];
      expect(tx.remittanceInformation).toBe('Invoice 2026-0042\nSecond remittance line');
    });

    it('folds repeated AddtlInf lines into one return-info string', () => {
      const tx = report.statements[0].entries[2].transactions[0];
      expect(tx.returnAdditionalInformation).toBe(
        'Incorrect account number\nReturned by beneficiary bank',
      );
    });

    it('resolves ReturnReason5Choice from either branch as a string', () => {
      const coded = report.statements[0].entries[2].transactions[0];
      const proprietary = report.statements[0].entries[3].transactions[0];
      expect(coded.returnReason).toBe('AC01');
      expect(coded.returnReasonSource).toBe('code');
      expect(proprietary.returnReason).toBe('BANKREJ');
      expect(proprietary.returnReasonSource).toBe('proprietary');
    });

    it('serializes the return reason back into its original choice branch', () => {
      const xml = report.serialize();
      expect(xml).toMatch(/<Rsn>\s*<Cd>AC01<\/Cd>\s*<\/Rsn>/);
      expect(xml).toMatch(/<Rsn>\s*<Prtry>BANKREJ<\/Prtry>\s*<\/Rsn>/);
    });

    it('captures both branches of Purpose2Choice', () => {
      const coded = report.statements[0].entries[0].transactions[0];
      const proprietary = report.statements[0].entries[2].transactions[0];
      expect(coded.purposeCode).toBe('SALA');
      expect(coded.proprietaryPurpose).toBeUndefined();
      expect(proprietary.proprietaryPurpose).toBe('INTERNAL');
      expect(proprietary.purposeCode).toBeUndefined();
    });

    it('serializes entries and statements that carry no dates', () => {
      expect(() => report.serialize()).not.toThrow();
    });
  });

  describe('with the v02 Goldman Sachs document', () => {
    it('still reads party names from the pre-v08 layout', () => {
      const report = CashManagementEndOfDayReport.fromXML(fs.readFileSync(v02Path, 'utf8'));
      const debtorNames = report.transactions.map((t) => t.debtor?.name).filter(Boolean);
      expect(debtorNames).toEqual(
        expect.arrayContaining(['TEST CLIENT', 'OPY USA INC.', 'JPMCHASEClient', 'Primrose']),
      );
    });

    it('still reads the BIC-spelled account servicer', () => {
      const report = CashManagementEndOfDayReport.fromXML(fs.readFileSync(v02Path, 'utf8'));
      expect(report.statements[0].agent).toEqual({ bic: 'GSCRUS30' });
    });

    it('keeps leading zeros in identifiers instead of coercing them to numbers', () => {
      const report = CashManagementEndOfDayReport.fromXML(fs.readFileSync(v02Path, 'utf8'));
      expect(report.transactions.map((t) => t.endToEndId)).toContain('021000020000017');
      expect(report.transactions.map((t) => t.paymentInformationId)).toContain('0000001');
    });
  });

  describe('with schema-optional elements omitted', () => {
    it('parses an Acct that carries no Id', () => {
      const xml = v12Xml.replace(
        /<Acct>\s*<Id>\s*<Othr>\s*<Id>DD01100056869<\/Id>\s*<\/Othr>\s*<\/Id>/,
        '<Acct>',
      );
      expect(xml).not.toBe(v12Xml);
      assertValidV12(xml);

      const report = CashManagementEndOfDayReport.fromXML(xml);
      expect(report.statements[0].account).toEqual({
        currency: 'USD',
        name: 'Operating Account',
      });
    });

    it('parses a statement that carries no CreDtTm', () => {
      // Only the statement-level element is optional; the group header's is mandatory.
      const xml = v12Xml.replace('<CreDtTm>2026-03-02T09:15:01.000Z</CreDtTm>', '');
      expect(xml).not.toBe(v12Xml);
      assertValidV12(xml);

      const report = CashManagementEndOfDayReport.fromXML(xml);
      expect(report.creationDate).toBeInstanceOf(Date);
      expect(report.statements[0].creationDate).toBeUndefined();
      expect(() => report.serialize()).not.toThrow();
    });

    it('parses a related account that carries no Id', () => {
      const xml = v12Xml.replace(
        /<DbtrAcct>\s*<Id>\s*<IBAN>DE89370400440532013000<\/IBAN>\s*<\/Id>\s*<\/DbtrAcct>/,
        '<DbtrAcct><Ccy>EUR</Ccy></DbtrAcct>',
      );
      expect(xml).not.toBe(v12Xml);
      assertValidV12(xml);

      const report = CashManagementEndOfDayReport.fromXML(xml);
      const tx = report.statements[0].entries[0].transactions[0];
      expect(tx.debtor?.name).toBe('ACME Supplies GmbH');
      expect(tx.debtor?.account).toEqual({ currency: 'EUR' });
    });
  });
});
