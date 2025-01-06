# iso20022.js

[![Coverage Status](https://coveralls.io/repos/github/svapnil/iso20022.js/badge.svg?branch=main)](https://coveralls.io/github/svapnil/iso20022.js?branch=main)

> [!IMPORTANT]
> Introducing [ISO20022 Pro](https://iso20022pro.com), the Web-App layer of ISO20022 - create and import ISO20022 files in a single UI.
>
> Check it out at https://iso20022pro.com.

This package is meant for companies using ISO20022 to send and receive payment information.

Read the Docs: https://docs.iso20022js.com

The mission of this NPM package is to connect the most widely used programming language to the most widely used payment standard.

If you're interested in using iso20022.js and would like to use different payment types or ingest files using CAMT, please email [svapnil@woodside.sh](mailto:svapnil@woodside.sh).

[![Book with Cal](https://cal.com/book-with-cal-dark.svg)](https://cal.com/woodside/iso20022js?utm_source=banner&utm_campaign=oss)

# Installation

```bash
npm install iso20022.js
```

# Usage

### Payment Initiation: Sending a SWIFT Transfer

```ts
import { ISO20022 } from 'iso20022.js';

const iso20022 = new ISO20022({
  initiatingParty: {
    name: 'Acme Corporation',
    id: 'ACMECORP',
    account: {
      accountNumber: '123456789012',
    },
    agent: {
      bic: 'CHASUS33',
      bankAddress: {
        country: 'US',
      },
    },
  },
});

const creditPaymentInitiation = iso20022.createSWIFTCreditPaymentInitiation({
  paymentInstructions: [
    {
      type: 'swift',
      direction: 'credit',
      amount: 1000,
      currency: 'USD',
      creditor: {
        name: 'Jane Smith',
        account: {
          iban: 'DE89370400440532013000',
        },
        agent: {
          bic: 'DEUTDEFF',
        },
        address: {
          streetName: '123 Main St',
          townName: 'Funkytown',
          postalCode: '12345',
          country: 'DE',
        },
      },
    },
  ],
});

console.log(creditPaymentInitiation.toString());
```

### Cash Management: Ingesting a CAMT.053 file

```ts
import { CashManagementEndOfDayReport } from 'iso20022.js';

const xml = fs.readFileSync('balance_report.xml', 'utf8');
const report = CashManagementEndOfDayReport.fromXML(xml);

console.log(report.transactions);
```

## About ISO20022

ISO20022 is the standard format for financial transactions. This library aims to build a powerful yet simple API to create these files, following Typescript conventions.

You might want to use this package if you need to create these types of files.

# Features

| Feature                | Description                                          | Todo |
| ---------------------- | ---------------------------------------------------- | ---- |
| SWIFT Credit Transfer  | Create SWIFT credit transfer messages                | ✅   |
| CAMT Transactions      | Ingest transaction data from CAMT files              | ✅   |
| SEPA Credit Transfer   | Create SEPA credit transfer messages                 | 🚧   |
| Fednow Credit Transfer | Create Fednow credit transfer messages               | 🚧   |

# Reasons to use `iso20022.js`
| XML Generation         | Generate valid ISO 20022 XML files                   | ✅   |
| Type Safety            | Built with TypeScript for enhanced type checking     | ✅   |
| Extensible             | Easy to extend for custom message types              | ✅   |
| Validation             | Built-in validation for ISO 20022 message structures | ✅   |
