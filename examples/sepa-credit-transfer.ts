import { SEPACreditPaymentInitiation } from '../src';
import { SEPACreditPaymentInitiationConfig } from '../src';

// Example of creating a SEPA credit transfer
async function main() {
    // In this example we're using a JPMC bank account
    const config: SEPACreditPaymentInitiationConfig = {
        initiatingParty: {
            name: 'Electrical',
            id: 'ELECTRIC',
            account: {
                iban: 'ES9121000418450200051332'
            },
            agent: {
                bic: 'BSCHESMMXXX',
                bankAddress: {
                    country: 'US'
                }
            }
        },
        paymentInstructions: [
            {
                type: 'sepa',
                direction: 'credit',
                creditor: {
                    name: 'Dáel Muñiz',
                    account: {
                        iban: 'ES8201822200150201504058'
                    },
                    agent: {
                        bic: 'BBVAESMMXXX'
                    },
                    address: {
                        streetName: 'Calle de Serrano',
                        buildingNumber: '41',
                        townName: 'Madrid',
                        countrySubDivision: 'Madrid',
                        postalCode: '28001',
                        country: 'ES'
                    }
                },
                amount: 1000,
                currency: 'EUR'
            }
        ]
    }

    const sepa = new SEPACreditPaymentInitiation(config)

    console.log(sepa.serialize())
}

main().catch(console.error)
