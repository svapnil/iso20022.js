import { ISO20022 } from "../src";

// Example of creating a RTP credit transfer
async function main() {
    // In this example we're using a JPMC bank account
    const iso20022 = new ISO20022({
        initiatingParty: {
            name: 'Electrical',
            id: 'ELECTRIC',
            account: {
                accountNumber: '123456789',
            },
            agent: {
                abaRoutingNumber: '123456789',
            },
        },
    });

    const payment = iso20022.createRTPCreditPaymentInitiation([
        {
            type: 'rtp',
            direction: 'credit',
            amount: 100000, // $1000.00
            currency: 'USD',
            creditor: {
                name: 'All-American Dogs Co.',
                account: {
                    accountNumber: '123456789012',
                },
                agent: {
                    abaRoutingNumber: '37714568112',
                }
            },
            remittanceInformation: '1000 Hot Dogs Feb26',
        }
    ]);

    console.log(payment.serialize());
}

main().catch(console.error)