import { XML, PARSED_VALUE_TAGS } from '../../src/lib/interfaces';
import { CashManagementEndOfDayReport } from '../../src/camt/053/cash-management-end-of-day-report';
import fs from 'fs';

describe('XML.getParser', () => {
  const parse = (xml: string) => XML.getParser().parse(xml);

  test('keeps numeric-looking text leaves as strings', () => {
    const doc = parse(`<Root>
      <EndToEndId>1004</EndToEndId>
      <AcctSvcrRef>501733226651</AcctSvcrRef>
      <MsgId>10.50</MsgId>
      <Ustrd>+1234</Ustrd>
      <Nm>true</Nm>
      <Id>1234567890123456</Id>
      <Cd>0001234</Cd>
      <NtryRef>032025007601064951000000001</NtryRef>
    </Root>`).Root;

    expect(doc.EndToEndId).toBe('1004');
    expect(doc.AcctSvcrRef).toBe('501733226651');
    expect(doc.MsgId).toBe('10.50');
    expect(doc.Ustrd).toBe('+1234');
    expect(doc.Nm).toBe('true');
    expect(doc.Id).toBe('1234567890123456');
    expect(doc.Cd).toBe('0001234');
    expect(doc.NtryRef).toBe('032025007601064951000000001');
  });

  test('keeps repeated text leaves as an array of strings', () => {
    const doc = parse(`<RmtInf><Ustrd>1001</Ustrd><Ustrd>false</Ustrd></RmtInf>`).RmtInf;
    expect(doc.Ustrd).toEqual(['1001', 'false']);
  });

  test('still parses amounts, counters, sequence numbers and the reversal indicator', () => {
    const doc = parse(`<Stmt>
      <ElctrncSeqNb>7</ElctrncSeqNb>
      <LglSeqNb>3</LglSeqNb>
      <TxsSummry><TtlNtries><NbOfNtries>14</NbOfNtries><Sum>1234.56</Sum><TtlNetNtryAmt>10.00</TtlNetNtryAmt></TtlNtries></TxsSummry>
      <Ntry><Amt Ccy="EUR">120.00</Amt><RvslInd>true</RvslInd></Ntry>
      <Pmt><IntrBkSttlmAmt><AmtWthCcy Ccy="USD">55.10</AmtWthCcy></IntrBkSttlmAmt><InstdAmt>1.5</InstdAmt></Pmt>
    </Stmt>`).Stmt;

    expect(doc.ElctrncSeqNb).toBe(7);
    expect(doc.LglSeqNb).toBe(3);
    expect(doc.TxsSummry.TtlNtries.NbOfNtries).toBe(14);
    expect(doc.TxsSummry.TtlNtries.Sum).toBe(1234.56);
    expect(doc.TxsSummry.TtlNtries.TtlNetNtryAmt).toBe(10);
    expect(doc.Ntry.Amt['#text']).toBe(120);
    expect(doc.Ntry.Amt['@_Ccy']).toBe('EUR');
    expect(doc.Ntry.RvslInd).toBe(true);
    expect(doc.Pmt.IntrBkSttlmAmt.AmtWthCcy['#text']).toBe(55.1);
    expect(doc.Pmt.InstdAmt).toBe(1.5);
  });

  test('number-parse options still guard the parsed leaves', () => {
    const doc = parse(`<R><Amt>007</Amt><Sum>1e5</Sum><NbOfNtries>0x1A</NbOfNtries></R>`).R;
    expect(doc.Amt).toBe('007');
    expect(doc.Sum).toBe('1e5');
    expect(doc.NbOfNtries).toBe('0x1A');
  });

  test('the parsed-leaf allowlist is the documented set', () => {
    expect([...PARSED_VALUE_TAGS].sort()).toEqual(
      ['Amt', 'AmtWthCcy', 'ElctrncSeqNb', 'InstdAmt', 'IntrBkSttlmAmt', 'LglSeqNb', 'NbOfNtries', 'RvslInd', 'Sum', 'TtlNetNtryAmt'],
    );
  });
});

describe('CashManagementEndOfDayReport text fields', () => {
  test('all-digit references from a real ING statement arrive as strings', () => {
    const xml = fs.readFileSync('test/assets/ing/example_camt.xml', 'utf8');
    const report = CashManagementEndOfDayReport.fromXML(xml);

    const endToEndIds = report.transactions.map(tx => tx.endToEndId).filter(v => v !== undefined);
    const servicerRefs = report.entries.map(entry => entry.accountServicerReferenceId).filter(v => v !== undefined);
    expect(endToEndIds).toContain('5000300060007000');
    expect(endToEndIds).toContain('6010512558977000');
    expect(servicerRefs).toContain('15180015077602405');
    for (const v of [...endToEndIds, ...servicerRefs]) expect(typeof v).toBe('string');
    expect(typeof report.statements[0].id).toBe('string');
  });

  test('a numeric remittance line and a "false" remittance line both survive', () => {
    const xml = `<?xml version="1.0"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02"><BkToCstmrStmt><GrpHdr><MsgId>20250107001</MsgId><CreDtTm>2025-01-07T08:00:00</CreDtTm></GrpHdr>
<Stmt><Id>2025007</Id><CreDtTm>2025-01-07T08:00:00</CreDtTm><Acct><Id><IBAN>NL24INGB0008768291</IBAN></Id><Ccy>EUR</Ccy></Acct>
<Ntry><NtryRef>1</NtryRef><Amt Ccy="EUR">120.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts>BOOK</Sts><BookgDt><Dt>2025-01-06</Dt></BookgDt>
<BkTxCd><Domn><Cd>PMNT</Cd><Fmly><Cd>RCDT</Cd><SubFmlyCd>ESCT</SubFmlyCd></Fmly></Domn></BkTxCd>
<AddtlNtryInf>2.10</AddtlNtryInf>
<NtryDtls><TxDtls><Refs><EndToEndId>501733226651</EndToEndId><AcctSvcrRef>+1234</AcctSvcrRef></Refs>
<RltdPties><Dbtr><Nm>true</Nm></Dbtr><DbtrAcct><Id><Othr><Id>123456789</Id></Othr></Id></DbtrAcct></RltdPties>
<RmtInf><Ustrd>1004</Ustrd><Ustrd>false</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry></Stmt></BkToCstmrStmt></Document>`;
    const report = CashManagementEndOfDayReport.fromXML(xml);
    const entry = report.entries[0];
    const tx = report.transactions[0];

    expect(report.messageId).toBe('20250107001');
    expect(report.statements[0].id).toBe('2025007');
    expect(entry.amount).toBe(12000);
    expect(entry.reversal).toBe(false);
    expect(entry.additionalInformation).toBe('2.10');
    expect(tx.endToEndId).toBe('501733226651');
    expect(tx.accountServicerReferenceId).toBe('+1234');
    expect(tx.debtor?.name).toBe('true');
    expect(tx.debtor?.account).toEqual({ accountNumber: '123456789' });
    expect(tx.remittanceInformation).toBe('1004\nfalse');
  });
});
