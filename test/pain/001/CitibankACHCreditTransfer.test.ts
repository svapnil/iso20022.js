import * as fs from 'fs';
import * as libxmljs from 'libxmljs';
import { Account } from '../../../src/lib/types.js';
import { CitibankACHCreditTransfer } from "../../../src/pain/001/CitibankACHCreditTransfer";
import { faker } from '@faker-js/faker';
import { Currency } from 'dinero.js';

describe('CitibankACHCreditTransfer', () => {
  const mockAccount = {
    accountNumber: faker.finance.accountNumber(),
    routingNumber: faker.finance.routingNumber(),
    accountType: 'checking' as const
  } as Account;

  const mockTransaction = {
    id: '123456',
    amount: 100000,
    currency: "USD" as Currency,
    creditor: {
      name: faker.person.fullName(),
      address: {
        line1: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postal_code: faker.location.zipCode(),
        country: "US"
      }
    },
    creditorAccount: {
      accountNumber: faker.finance.accountNumber(),
      routingNumber: faker.finance.routingNumber(),
      accountType: 'checking' as const
    }
  };

  const mockConfig = {
    originatingPartyName: faker.company.name(),
    originatingPartyAccount: {
      accountNumber: faker.finance.accountNumber(),
      routingNumber: faker.finance.routingNumber(),
      accountType: 'checking' as const
    }
  };

  let creditTransfer: CitibankACHCreditTransfer;

  beforeEach(() => {
    creditTransfer = new CitibankACHCreditTransfer([mockTransaction], mockConfig);
  });

  test('serialize should return a valid XML string', () => {
    const xml = creditTransfer.serialize();
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">');
  });

  test('serialized XML should validate against XSD schema', () => {
    const xml = creditTransfer.serialize();
    const xsdSchema = fs.readFileSync(`${process.cwd()}/schemas/pain/pain.001.001.03.xsd`, 'utf8');
    const xmlDoc = libxmljs.parseXml(xml);
    const xsdDoc = libxmljs.parseXml(xsdSchema);

    const isValid = xmlDoc.validate(xsdDoc);
    debugger;
    expect(isValid).toBeTruthy();
  });
});