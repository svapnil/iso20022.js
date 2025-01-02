import { ISO20022 } from '../src';

// Example of creating a SWIFT credit transfer
async function main() {
    // In this example we're using a JPMC bank account
    const iso20022 = new ISO20022({
        initiatingParty: {
            name: 'Example Corp',
            id: 'EXAMPLECORP',
            account: {
                accountNumber: '123456789',
            },
            agent: {
                bic: 'CHASUS33',
                bankAddress: {
                    country: 'US',
                },
            },
        },
    });

    // Create a SWIFT credit transfer to a German creditor
    const payment = iso20022.createSWIFTCreditPaymentInitiation(
        [
            {
                type: 'swift',
                direction: 'credit',
                amount: 1000,
                currency: 'USD',
                creditor: {
                    name: 'Hans Schneider',
                    account: {
                        accountNumber: '987654321',
                    },
                    agent: {
                        bic: 'DEUTDEFF',
                        bankAddress: {
                            country: 'DE',
                        },
                    },
                    address: {
                        streetName: 'Hauptstraße',
                        buildingNumber: '42',
                        postalCode: '10115',
                        townName: 'Berlin',
                        country: 'DE',
                    },
                },
                remittanceInformation: 'Invoice payment #123',
            },
        ],
    );

    const xml = await payment.serialize();
    console.log(xml);
}

main().catch(console.error);
