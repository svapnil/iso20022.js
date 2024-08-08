import { SWIFTCreditPaymentInitiation } from '../../../src/pain/001/SWIFTCreditPaymentInitiation';
import ISO20022 from '../../../src/iso20022';
import fs from 'fs';
import libxmljs from 'libxmljs';

describe('SWIFTCreditPaymentInitiation', () => {
  let iso20022: ISO20022;
  let swiftPayment: SWIFTCreditPaymentInitiation;

  beforeEach(() => {
    iso20022 = new ISO20022({
      initiatingParty: {
        name: 'Acme Corporation',
        id: 'ACMEID',
        account: {
          accountNumber: '123456789012',
        },
        agent: {
          bic: 'CHASUS33',
        },
      },
    });

    swiftPayment = iso20022.createSWIFTCreditPaymentInitiation([
      {
        type: 'swift',
        direction: 'credit',
        amount: 1000,
        currency: 'USD',
        creditor: {
          name: 'John Doe',
          account: {
            iban: 'DE1234567890123456',
          },
          agent: {
            bic: 'DEUTDEFF',
          },
          address: {
            streetName: 'Main St',
            buildingNumber: '123',
            postalCode: '12345',
            townName: 'Funkytown',
            country: 'DE',
          },
        },
      },
    ]);
  });

  test('should create a SWIFTCreditPaymentInitiation instance', () => {
    expect(swiftPayment).toBeInstanceOf(SWIFTCreditPaymentInitiation);
  });

  test('should serialize to XML', () => {
    const xml = swiftPayment.serialize();
    expect(xml).toContain('<Document');
    // Add more specific XML checks here
  });

  test('serialized XML should validate against XSD', () => {
    const xml = swiftPayment.serialize();
    const xsdSchema = fs.readFileSync(
      `${process.cwd()}/schemas/pain/pain.001.001.03.xsd`,
      'utf8',
    );
    const xmlDoc = libxmljs.parseXml(xml);
    const xsdDoc = libxmljs.parseXml(xsdSchema);

    const isValid = xmlDoc.validate(xsdDoc);
    expect(isValid).toBeTruthy();
  });
});
