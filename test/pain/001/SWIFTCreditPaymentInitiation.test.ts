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
                name: 'ACME Corporation',
                id: 'ACMEID',
                account: {
                    iban: 'DE1234567890123456',
                },
                agent: {
                    bic: 'DEUTDEFF'
                }
            }
        });

        swiftPayment = iso20022.createSWIFTCreditPaymentInitiation([
            {
                type: 'swift',
                direction: 'credit',
                amount: 1000,
                currency: 'EUR',
                creditor: {
                    name: 'John Doe',
                    account: {
                        iban: 'DE1234567890123456',
                    },
                    agent: {
                        bic: 'DEUTDEFF'
                    }
                },
            }
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
        const xsdSchema = fs.readFileSync(`${process.cwd()}/schemas/pain/pain.001.001.03.xsd`, 'utf8');
        const xmlDoc = libxmljs.parseXml(xml);
        const xsdDoc = libxmljs.parseXml(xsdSchema);

        const isValid = xmlDoc.validate(xsdDoc);
        expect(isValid).toBeTruthy();
    });
});
