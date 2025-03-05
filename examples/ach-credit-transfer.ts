
import { ISO20022 } from "../src";

// Example of creating a RTP credit transfer
async function main() {
    // In this example we're using a JPMC bank account
    const iso20022 = new ISO20022({
        initiatingParty: {
            name: 'Jon Doe LL.',
            id: 'ELECTRIC',
            account: {
                accountNumber: '123456789',
            },
            agent: {
                abaRoutingNumber: '123456789',
            },
        },
    });

    // Send an ACH Payment Anywhere in the U.S.
    const payment = iso20022.createACHCreditPaymentInitiation({
        paymentInstructions: [
            {
            type: 'ach',
            direction: 'credit',
            amount: 1250000, // $12,500.00 Dollars
            currency: 'USD',
            creditor: {
                name: 'Alex Kan',
                account: {
                    accountNumber: '333456118812',
                },
                agent: {
                    abaRoutingNumber: '021000021',
                }
            },
            remittanceInformation: 'PAYROLL - BIWEEKLY SALARY SR SOFTWARE ENGINEER'
        }],
    });

    console.log(payment.serialize());
}

main().catch(console.error)
