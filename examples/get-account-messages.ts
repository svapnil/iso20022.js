import ISO, {
  getCurrencyPrecision,
  getISO20022Implementation,
  ISO20022Messages,
} from '../src/iso20022.js';
import fs from 'fs';

const iso = new ISO({
  initiatingParty: {}, // minimal initiating party (can be empty)
});

let impl = getISO20022Implementation(ISO20022Messages.CAMT_003);
if (!impl) {
  throw new Error('No implementation found for CAMT.003');
}

// const json = fs.readFileSync(
//   `${process.cwd()}/test/assets/camt/camt.003.sample1.json`,
//   'utf-8',
// );

// let msg = impl.fromJSON(json);

// console.log('Parsed CAMT.003 from JSON\n', JSON.stringify(msg.data, null, 2));

let msg = iso.createMessage(ISO20022Messages.CAMT_003, {
  header: {
    id: 'ABCDEFGHIXXX1202104120040297654321',
    creationDateTime: new Date('2021-09-28T13:41:47.123Z'),
  },
  newCriteria: {
    searchCriteria: [
      {
        accountEqualTo: {
          id: '02345678943',
          issuer: 'AGRIFRPPXXX',
        },
        currencyEqualTo: 'USD',
        balanceAsOfDateEqualTo: new Date('2021-09-28T00:00:00.000Z'),
      },
    ],
  },
});

const json = msg.toJSON(); // produce a js object (not a string yet)
// send the json to the other side of the world as a string
// const jsonString = JSON.stringify(json);

// receive the json string response from the other side of the world
const jsonResponse = fs.readFileSync(
  `${process.cwd()}/test/assets/camt/camt.004.sample1.json`,
  'utf-8',
);

impl = getISO20022Implementation(ISO20022Messages.CAMT_004);
if (!impl) {
  throw new Error('No implementation found for CAMT.004');
}
const receivedMsg = impl.fromJSON(jsonResponse);
console.log('Received CAMT.004 from JSON\n', JSON.stringify(receivedMsg.data, null, 2));
console.log("Note that the amount are in the lowest decimals precision and the precision of USD is", getCurrencyPrecision("USD"));
