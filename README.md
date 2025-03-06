> [!IMPORTANT]
> Introducing [Fiat Web Services](https://fiatwebservices.com), a managed platform and SDK to save and send B2B payments.
>
> Check it out at https://fiatwebservices.com.

<div align="center">
  <a href="https://iso20022js.com">
    <img alt="iso20022.js logo" src="https://github.com/user-attachments/assets/662bc55f-2be0-41dc-b79e-d62f325b1f80" height="128">
  </a>
  <h1>iso20022.js</h1>
  <a href=""><img alt="github stars" src="https://img.shields.io/github/stars/svapnil/iso20022.js?color=FFD700&label=Stars&logo=Github"></a>
  <a href="https://coveralls.io/github/svapnil/iso20022.js?branch=main"><img alt="coverage" src="https://coveralls.io/repos/github/svapnil/iso20022.js/badge.svg?branch=main"></a>
</div>


This package is meant for companies using ISO20022 to send and receive payment information, specifically initiating SEPA, ACH, FedWire, RTP, SWIFT payments and receiving cash management files.

Read the Docs: https://docs.iso20022js.com

The mission of this NPM package is to connect the most widely used programming language to the most widely used payment standard.

If you're interested in using iso20022.js and would like to use different payment types or ingest files using CAMT, please email [iso20022js@woodside.sh](mailto:iso20022js@woodside.sh).

[![Book with Cal](https://cal.com/book-with-cal-dark.svg)](https://cal.com/woodside/iso20022js?utm_source=banner&utm_campaign=oss)

<a href="https://news.ycombinator.com/item?id=41163645">
  <img
    style="width: 250px; height: 54px;" width="250" height="54"
    alt="Featured on Hacker News"
    src="https://hackernews-badge.vercel.app/api?id=41163645"
  />
</a>


# Installation

```bash
npm install iso20022.js
```

# Examples 

Examples of ISO20022 messages being created across different payment types:

```bash
npx tsx examples/sepa-credit-transfer.ts
npx tsx examples/rtp-credit-transfer.ts
npx tsx examples/swift-credit-transfer.ts
```

# Usage

### Full Payment Initiation Example: Sending a SEPA Transfer

```ts
import { ISO20022 } from 'iso20022.js';

const iso20022 = new ISO20022({
  initiatingParty: {
    name: 'Acme Corporation',
    id: 'ACMECORP',
    account: {
      iban: 'ES1234567890123456789012'
    },
    agent: {
      bic: 'BANKESMMXXX',
      bankAddress: {
        country: 'ES'
      }
    }
  },
});

const creditPaymentInitiation = iso20022.createSEPACreditPaymentInitiation([
  {
    type: 'sepa',
    direction: 'credit',
    amount: 1000,
    currency: 'EUR',
    creditor: {
      name: 'Hans Schmidt',
      account: {
        iban: 'DE1234567890123456789012'
      },
      agent: {
        bic: 'DEUTDEFFXXX'
      },
      address: {
        streetName: 'Example Street',
        buildingNumber: '123',
        townName: 'Berlin',
        countrySubDivision: 'Berlin',
        postalCode: '10115',
        country: 'DE'
      }
    }
  }
]);

console.log(creditPaymentInitiation.toString());
```

### Example: Sending an ACH Payment

```ts
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
```

### Cash Management: Ingesting a CAMT.053 file

```ts
import { CashManagementEndOfDayReport } from 'iso20022.js';

const xml = fs.readFileSync('balance_report.xml', 'utf8');
const report = CashManagementEndOfDayReport.fromXML(xml);

console.log(report.transactions);
```

### Testing

```bash
npm run test
```

## About ISO20022

ISO20022 is the standard format for financial transactions. This library aims to build a powerful yet simple API to create these files, following Typescript conventions.

You might want to use this package if you need to create these types of files.

# Features

| Feature                | Description                                          | Todo |
| ---------------------- | ---------------------------------------------------- | ---- |
| SWIFT Credit Transfer  | Create SWIFT credit transfer messages                | ✅   |
| CAMT Transactions      | Ingest transaction data from CAMT files              | ✅   |
| SEPA Credit Transfer   | Create SEPA credit transfer messages                 | ✅   |
| ACH Credit Transfer    | Create ACH credit transfer messages                  | ✅   |
| RTP / Fednow Credit Transfer | Create Fednow credit transfer messages         | ✅   |
| FedWire Credit Transfer | Create FedWire credit transfer messages               | 🚧   |


# Reasons to use `iso20022.js`

| Feature                | Description                                          |      |
| ---------------------- | ---------------------------------------------------- | ---- |
| XML Generation         | Generate valid ISO 20022 XML files                   | ✅   |
| Type Safety            | Built with TypeScript for enhanced type checking     | ✅   |
| Extensible             | Easy to extend for custom message types              | ✅   |
| Validation             | Built-in validation for ISO 20022 message structures | ✅   |

# Security

`iso20022.js` is local, open source, and free to use. This means that payment instructions are created on your machine, not on a remote server.

We take security seriously, and are consistently looking for ways to improve. If you have any suggestions or find any security issues, please [open an issue](https://github.com/svapnil/iso20022.js/issues/new/choose).

**NOTE: We are tracking the [libxmljs vulnerability](https://github.com/svapnil/iso20022.js/issues/26), a dependency we use in our unit tests and have a plan to deprecate. Note that production use of `iso20022.js` is not affected by this vulnerability.**
