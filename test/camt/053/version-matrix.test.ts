import { CashManagementEndOfDayReport } from '../../../src/camt/053/cash-management-end-of-day-report';
import { buildCamt053, VERSION_PROFILES, Camt053Version } from './fixtures/camt053-generator';
import libxmljs from 'libxmljs';
import fs from 'fs';

/**
 * Version matrix: the same logical statement is generated in each supported
 * schema version's wire structure, validated against that version's XSD, and
 * must parse to one canonical result. A version is "supported" when it has a
 * row in VERSION_PROFILES; adding a row is all it takes to extend the matrix.
 *
 * XSD validation is skipped — visibly, never silently — when the schema for a
 * version is not present in schemas/camt/. Parsing to the canonical result
 * always runs.
 */
const versions = Object.keys(VERSION_PROFILES) as Camt053Version[];

/** The one result every version must produce. Dates are asserted by type only. */
const CANONICAL = {
  messageId: 'MATRIX-MSG-0001',
  creationDate: expect.any(Date),
  recipient: { id: 'test001', name: 'Test Client Ltd.' },
  statements: [
    {
      id: 'MATRIX-STMT-0001',
      electronicSequenceNumber: 7,
      legalSequenceNumber: 7,
      creationDate: expect.any(Date),
      fromDate: expect.any(Date),
      toDate: expect.any(Date),
      numOfEntries: 4,
      account: { accountNumber: 'DD01100056869', currency: 'USD', name: 'Operating Account' },
      agent: { bic: 'GSCRUS30XXX' },
      balances: [
        { type: 'OPBD', amount: 100000, creditDebitIndicator: 'credit', currency: 'USD', date: expect.any(Date) },
        { type: 'CLBD', amount: 110281, creditDebitIndicator: 'credit', currency: 'USD', date: expect.any(Date) },
        { type: 'CUSTBAL', amount: 110281, creditDebitIndicator: 'credit', currency: 'USD', date: expect.any(Date) },
      ],
      entries: [
        {
          referenceId: 'E1-BOOKED-CREDIT',
          amount: 829,
          creditDebitIndicator: 'credit',
          reversal: false,
          bookingDate: expect.any(Date),
          accountServicerReferenceId: 'ASR-0001',
          additionalInformation: 'Booked credit',
          bankTransactionCode: {
            domainCode: 'PMNT',
            domainFamilyCode: 'RCDT',
            domainSubFamilyCode: 'ESCT',
            proprietaryCode: 'SEPA-IN',
            proprietaryCodeIssuer: 'GS',
          },
          transactions: [
            {
              messageId: 'PMT-MSG-0001',
              endToEndId: 'E2E-0001',
              debtor: {
                name: 'ACME Supplies GmbH',
                account: { iban: 'DE89370400440532013000' },
                agent: { bic: 'COBADEFFXXX' },
              },
              creditor: {
                name: 'Test Client Ltd.',
                account: { accountNumber: 'DD01100056869' },
                agent: { bic: 'GSCRUS30XXX' },
              },
              purposeCode: 'SALA',
              remittanceInformation: 'Invoice 2026-0042\nSecond remittance line',
            },
          ],
        },
        {
          referenceId: 'E2-PENDING-DEBIT',
          amount: 435,
          creditDebitIndicator: 'debit',
          bookingDate: undefined,
          transactions: [],
        },
        {
          referenceId: 'E3-RETURN-CODED',
          amount: 113,
          creditDebitIndicator: 'debit',
          reversal: true,
          bookingDate: expect.any(Date),
          transactions: [
            {
              endToEndId: 'E2E-0003',
              proprietaryPurpose: 'INTERNAL',
              returnReason: 'AC01',
              returnReasonSource: 'code',
              returnAdditionalInformation: 'Incorrect account number\nReturned by beneficiary bank',
            },
          ],
        },
        {
          referenceId: 'E4-RETURN-PRTRY',
          amount: 10000,
          creditDebitIndicator: 'credit',
          transactions: [{ returnReason: 'BANKREJ', returnReasonSource: 'proprietary' }],
        },
      ],
    },
  ],
};

describe.each(versions)('camt.053.001.%s', (version) => {
  const xsdPath = `${process.cwd()}/schemas/camt/camt.053.001.${version}.xsd`;
  const hasXsd = fs.existsSync(xsdPath);
  const xml = buildCamt053(version);

  // it.skip keeps the missing schema visible in the run output instead of
  // quietly passing a version that was never validated.
  (hasXsd ? it : it.skip)(`validates against schemas/camt/camt.053.001.${version}.xsd`, () => {
    const xmlDoc = libxmljs.parseXml(xml);
    const xsdDoc = libxmljs.parseXml(fs.readFileSync(xsdPath, 'utf8'));
    if (!xmlDoc.validate(xsdDoc)) {
      const messages = xmlDoc.validationErrors.map((e) => e.message.trim());
      throw new Error(`Generated document does not validate:\n${messages.join('\n')}`);
    }
  });

  it('parses to the canonical statement', () => {
    const report = CashManagementEndOfDayReport.fromXML(xml);
    expect(report).toMatchObject(CANONICAL);
  });

  it('survives a serialize/parse round trip', () => {
    const first = CashManagementEndOfDayReport.fromXML(xml);
    const second = CashManagementEndOfDayReport.fromXML(first.serialize());
    expect(second).toMatchObject(CANONICAL);
  });
});
