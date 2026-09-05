/**
 * Emits one logical CAMT.053 statement in the wire structure of a given
 * schema version, so the version-matrix tests can prove the parser produces
 * identical output regardless of which version a bank sends.
 *
 * Only a handful of structures the parser depends on change between versions;
 * each is a switch in VERSION_PROFILES. Every profile row must be pinned from
 * evidence — the version's XSD, or real bank output — never from memory:
 *
 *   02  pinned from test/assets/goldman_sachs (real bank output)
 *   08  pinned from the ISO 20022 eRepository (2026-09-04 export),
 *       BankToCustomerStatementV08 — the same export independently
 *       reproduces the 02 and 12 rows below
 *   12  pinned from schemas/camt/camt.053.001.12.xsd
 *
 * To add a version, inspect its XSD for the three switches below and add a
 * row. The matrix test picks it up automatically and validates the generated
 * document against schemas/camt/camt.053.001.<version>.xsd when that file is
 * present.
 */
export const VERSION_PROFILES = {
  '02': {
    /** Dbtr/Cdtr hold the party directly (Dbtr/Nm). */
    partyWrapper: false,
    /** FinancialInstitutionIdentification7 spells it BIC. */
    bicElement: 'BIC',
    /** Sts is the EntryStatus2Code simple type. */
    statusAsChoice: false,
  },
  '08': {
    /** Dbtr/Cdtr are Party40Choice (Pty | Agt) — the same shape v12's Party50Choice keeps. */
    partyWrapper: true,
    /** FinancialInstitutionIdentification18 spells it BICFI. */
    bicElement: 'BICFI',
    /** Sts is EntryStatus1Choice (Sts/Cd). */
    statusAsChoice: true,
  },
  '12': {
    /** Dbtr/Cdtr are Party50Choice; the party sits under Pty (Dbtr/Pty/Nm). */
    partyWrapper: true,
    /** FinancialInstitutionIdentification23 spells it BICFI. */
    bicElement: 'BICFI',
    /** Sts is EntryStatus1Choice (Sts/Cd). */
    statusAsChoice: true,
  },
} as const;

export type Camt053Version = keyof typeof VERSION_PROFILES;

export const camt053Namespace = (version: Camt053Version): string =>
  `urn:iso:std:iso:20022:tech:xsd:camt.053.001.${version}`;

/**
 * Builds the statement. Element order follows the xs:sequence shared by every
 * version's AccountStatement / ReportEntry / EntryTransaction types; only the
 * profile switches change between versions.
 */
export const buildCamt053 = (version: Camt053Version): string => {
  const p = VERSION_PROFILES[version];

  const party = (name: string): string =>
    p.partyWrapper ? `<Pty><Nm>${name}</Nm></Pty>` : `<Nm>${name}</Nm>`;
  const agent = (bic: string): string =>
    `<FinInstnId><${p.bicElement}>${bic}</${p.bicElement}></FinInstnId>`;
  const status = (code: string): string =>
    p.statusAsChoice ? `<Sts><Cd>${code}</Cd></Sts>` : `<Sts>${code}</Sts>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="${camt053Namespace(version)}">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>MATRIX-MSG-0001</MsgId>
      <CreDtTm>2026-03-02T09:15:00.000Z</CreDtTm>
      <MsgRcpt>
        <Nm>Test Client Ltd.</Nm>
        <Id><OrgId><Othr><Id>test001</Id></Othr></OrgId></Id>
      </MsgRcpt>
    </GrpHdr>
    <Stmt>
      <Id>MATRIX-STMT-0001</Id>
      <ElctrncSeqNb>7</ElctrncSeqNb>
      <LglSeqNb>7</LglSeqNb>
      <CreDtTm>2026-03-02T09:15:01.000Z</CreDtTm>
      <FrToDt>
        <FrDtTm>2026-03-01T00:00:00.000Z</FrDtTm>
        <ToDtTm>2026-03-01T23:59:59.000Z</ToDtTm>
      </FrToDt>
      <Acct>
        <Id><Othr><Id>DD01100056869</Id></Othr></Id>
        <Ccy>USD</Ccy>
        <Nm>Operating Account</Nm>
        <Svcr>${agent('GSCRUS30XXX')}</Svcr>
      </Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="USD">1000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2026-03-01</Dt></Dt>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="USD">1102.81</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><DtTm>2026-03-01T23:59:59.000Z</DtTm></Dt>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Prtry>CUSTBAL</Prtry></CdOrPrtry></Tp>
        <Amt Ccy="USD">1102.81</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2026-03-01</Dt></Dt>
      </Bal>
      <TxsSummry>
        <TtlNtries><NbOfNtries>4</NbOfNtries><Sum>113.77</Sum></TtlNtries>
      </TxsSummry>
      <Ntry>
        <NtryRef>E1-BOOKED-CREDIT</NtryRef>
        <Amt Ccy="USD">8.29</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <RvslInd>false</RvslInd>
        ${status('BOOK')}
        <BookgDt><DtTm>2026-03-01T10:12:00.000Z</DtTm></BookgDt>
        <AcctSvcrRef>ASR-0001</AcctSvcrRef>
        <BkTxCd>
          <Domn><Cd>PMNT</Cd><Fmly><Cd>RCDT</Cd><SubFmlyCd>ESCT</SubFmlyCd></Fmly></Domn>
          <Prtry><Cd>SEPA-IN</Cd><Issr>GS</Issr></Prtry>
        </BkTxCd>
        <NtryDtls>
          <TxDtls>
            <Refs><MsgId>PMT-MSG-0001</MsgId><EndToEndId>E2E-0001</EndToEndId></Refs>
            <RltdPties>
              <Dbtr>${party('ACME Supplies GmbH')}</Dbtr>
              <DbtrAcct><Id><IBAN>DE89370400440532013000</IBAN></Id></DbtrAcct>
              <Cdtr>${party('Test Client Ltd.')}</Cdtr>
              <CdtrAcct><Id><Othr><Id>DD01100056869</Id></Othr></Id></CdtrAcct>
            </RltdPties>
            <RltdAgts>
              <DbtrAgt>${agent('COBADEFFXXX')}</DbtrAgt>
              <CdtrAgt>${agent('GSCRUS30XXX')}</CdtrAgt>
            </RltdAgts>
            <Purp><Cd>SALA</Cd></Purp>
            <RmtInf>
              <Ustrd>Invoice 2026-0042</Ustrd>
              <Ustrd>Second remittance line</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
        <AddtlNtryInf>Booked credit</AddtlNtryInf>
      </Ntry>
      <Ntry>
        <NtryRef>E2-PENDING-DEBIT</NtryRef>
        <Amt Ccy="USD">4.35</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        ${status('PDNG')}
        <BkTxCd><Prtry><Cd>ACH-OUT</Cd></Prtry></BkTxCd>
      </Ntry>
      <Ntry>
        <NtryRef>E3-RETURN-CODED</NtryRef>
        <Amt Ccy="USD">1.13</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <RvslInd>true</RvslInd>
        ${status('BOOK')}
        <BookgDt><Dt>2026-03-01</Dt></BookgDt>
        <BkTxCd>
          <Domn><Cd>PMNT</Cd><Fmly><Cd>ICDT</Cd><SubFmlyCd>RRTN</SubFmlyCd></Fmly></Domn>
        </BkTxCd>
        <NtryDtls>
          <TxDtls>
            <Refs><EndToEndId>E2E-0003</EndToEndId></Refs>
            <Purp><Prtry>INTERNAL</Prtry></Purp>
            <RtrInf>
              <Rsn><Cd>AC01</Cd></Rsn>
              <AddtlInf>Incorrect account number</AddtlInf>
              <AddtlInf>Returned by beneficiary bank</AddtlInf>
            </RtrInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <NtryRef>E4-RETURN-PRTRY</NtryRef>
        <Amt Ccy="USD">100.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        ${status('BOOK')}
        <BookgDt><DtTm>2026-03-01T15:00:00.000Z</DtTm></BookgDt>
        <BkTxCd><Prtry><Cd>RETURN</Cd></Prtry></BkTxCd>
        <NtryDtls>
          <TxDtls>
            <RtrInf><Rsn><Prtry>BANKREJ</Prtry></Rsn></RtrInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>
`;
};
