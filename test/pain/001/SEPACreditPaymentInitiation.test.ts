import { SEPACreditPaymentInitiation, SEPACreditPaymentInitiationConfig } from "../../../src/pain/001/SEPACreditPaymentInitiation";
import libxmljs from 'libxmljs';
import fs from 'fs';

describe('SEPACreditPaymentInitiation', () => {
    let sepaPaymentInitiationConfig: SEPACreditPaymentInitiationConfig;
    let sepaPayment: SEPACreditPaymentInitiation;

    beforeEach(() => {
        sepaPaymentInitiationConfig = {
            initiatingParty: {
                name: "Electrical",
                id: "ELECTRIC",
                account: {
                    iban: "ES9121000418450200051332"
                },
                agent: {
                    bic: "BSCHESMMXXX",
                    bankAddress: {
                        country: 'US'
                    }
                }
            },
            paymentInstructions: [
                {
                    type: 'sepa',
                    direction: "credit",
                    creditor: {
                        name: "Dáel Muñiz",
                        account: {
                            iban: "ES8201822200150201504058"
                        },
                        agent: {
                            bic: "BBVAESMMXXX"
                        },
                        address: {
                            streetName: "Calle de Serrano",
                            buildingNumber: "41",
                            townName: "Madrid",
                            countrySubDivision: "Madrid",
                            postalCode: "28001",
                            country: "ES"
                        }
                    },
                    amount: 1000,
                    currency: "EUR"
                },
                {
                    type: 'sepa',
                    direction: "credit",
                    creditor: {
                        name: "Carmen García",
                        account: {
                            iban: "ES7100302053091234567895"
                        },
                        agent: {
                            bic: "ESPBESMMXXX"
                        },
                        address: {
                            streetName: "Paseo de la Castellana",
                            buildingNumber: "125",
                            townName: "Madrid",
                            countrySubDivision: "Madrid",
                            postalCode: "28046",
                            country: "ES"
                        }
                    },
                    amount: 2500,
                    currency: "EUR"
                }
            ]
        }
    })

    test('should create a SEPACreditPaymentInitiation instance', () => {
        sepaPayment = new SEPACreditPaymentInitiation(sepaPaymentInitiationConfig)
        expect(sepaPayment).toBeInstanceOf(SEPACreditPaymentInitiation);
    });

    test('should serialize to XML', () => {
        sepaPayment = new SEPACreditPaymentInitiation(sepaPaymentInitiationConfig)
        const xml = sepaPayment.serialize();
        expect(xml).toContain('<Document');
        // Add more specific XML checks here
    });

    test('should validate against XSD', () => {
        sepaPayment = new SEPACreditPaymentInitiation(sepaPaymentInitiationConfig)
        const xml = sepaPayment.serialize();
        const xsdSchema = fs.readFileSync(
            `${process.cwd()}/schemas/pain/pain.001.001.03.xsd`,
            'utf8',
        );
        const xmlDoc = libxmljs.parseXml(xml);
        const xsdDoc = libxmljs.parseXml(xsdSchema);

        const isValid = xmlDoc.validate(xsdDoc);
        expect(isValid).toBeTruthy();
    });

    describe('should fail is there are different payment instruction currencies', () => {
        it('should throw an error', () => {
            expect(() => {
                sepaPaymentInitiationConfig.paymentInstructions[1].currency = "USD" // Change currency
                new SEPACreditPaymentInitiation(sepaPaymentInitiationConfig)
            }).toThrow("In order to calculation payment instructions sum, all payment instruction currencies must be the same.");
        });
    });
})