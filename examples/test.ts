import { ISO20022 } from '../src';

// In this example we're using a Spanish bank account
const checking = new ISO20022({
    initiatingParty: {
        name: 'Electrical',
        id: 'ELECTRIC',
        account: {
            iban: 'ES9121000418450200051332'
        },
        agent: {
            bic: 'BSCHESMMXXX',
            bankAddress: {
                country: 'ES'
            }
        }
    },
});

const payment = checking.createSEPACreditPaymentInitiation([
    {
        type: 'sepa',
        direction: 'credit',
        amount: 9060000, // €90600.00 Euros
        currency: 'EUR',
        creditor: {
            name: 'WunderBrew Co.',
            account: {
                iban: 'DE89370400440532013000',
            },
        },
        remittanceInformation: '100,000 Beers',
    }
]);

payment.serialize();
