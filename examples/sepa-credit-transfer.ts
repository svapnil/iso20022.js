import { ISO20022 } from '../src';

// Example of creating a SEPA credit transfer
async function main() {
    // In this example we're using a Spanish bank account
    const iso20022 = new ISO20022({
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
    });

    const payment = iso20022.createSEPACreditPaymentInitiation([
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
    ]);

    console.log(payment.serialize())
}

main().catch(console.error)
