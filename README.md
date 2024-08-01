# iso20022.js (WIP 🚧)
iso20022.js is a Node library for creating and managing ISO 20022 XML files.

# Installation

```bash
npm install iso20022.js
```

# Usage

```ts
import { ISO20022 } from 'iso20022.js'

const iso20022 = new ISO20022({
    initiatingParty: {
        name: 'ACME Corporation',
        id: 'ACMECorp',
        account: {
            iban: 'DE89370400440532013000',
        },
        agent: {
            bic: 'DEUTDEFF',
            bankAddress: {
                country: 'DE',
            }
        }
    }
});

const creditTransfer = iso20022.createSWIFTCreditPaymentInitiation([{
    type: 'swift',
    direction: 'credit',
    amount: 1000,
    currency: 'USD',
    creditor: {
        name: 'Jane Smith',
        account: {
            iban: 'DE89370400440532013000'
        },
        agent: {
            bic: 'DEUTDEFF',
            bankAddress: {
                country: 'DE',
            }
        }
    }
}]);

console.log(creditTransfer.toString());
```



## About

The mission of this NPM package is to make it easy to create and manage extensible XML functions.

ISO20022 is the standard format for financial transactions. This library aims to build a standard interface to create these files, following Typescript conventions. 

You might want to use this package if you need to create these types of files. 

# Features 

| Feature | Description | Todo |
|---------|-------------|------|
| SWIFT Credit Transfer | Create SWIFT credit transfer messages | ✅ |
| SEPA Credit Transfer | Create SEPA credit transfer messages | 🚧 |
| Fednow Credit Transfer | Create Fednow credit transfer messages | 🚧 |
| XML Generation | Generate valid ISO 20022 XML files | ✅ |
| Type Safety | Built with TypeScript for enhanced type checking | ✅ |
| Extensible | Easy to extend for custom message types | ✅ |
| Validation | Built-in validation for ISO 20022 message structures | ✅ |

If you're interested in using iso20022.js and would like to use different payment types or ingest files using CAMT, please email [svapnil@woodside.sh](mailto:svapnil@woodside.sh).