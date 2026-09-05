import { CashManagementGetTransaction } from '../../../src/camt/005/cash-management-get-transaction';
import libxmljs from 'libxmljs';
import fs from 'fs';

describe('CAMT.005 conformance', () => {
  const xsd = libxmljs.parseXml(fs.readFileSync(`${process.cwd()}/schemas/camt/camt.005.001.11.xsd`, 'utf8'));
  const xml = fs.readFileSync(`${process.cwd()}/test/assets/synthetic/camt_005_001_11_sample.xml`, 'utf8');

  it('fixture validates against camt.005.001.11', () => {
    const parsed = libxmljs.parseXml(xml);
    if (!parsed.validate(xsd)) {
      throw new Error(parsed.validationErrors.map((e) => e.message.trim()).join('\n'));
    }
  });

  it('parses a query whose second criterion has no PmtSch (minOccurs=0)', () => {
    const message = CashManagementGetTransaction.fromXML(xml);
    const criteria = message.data.newCriteria?.searchCriteria ?? [];
    expect(criteria.find((c) => c.type === 'PmtSch.MsgId')?.msgIdsEqualTo).toEqual(['PMT-MSG-0001']);
    expect(criteria.find((c) => c.type === 'PmtSch.PmtId.LngBizId.EndToEndId')?.endToEndIdEqualTo).toEqual(['E2E-0001']);
  });
});
