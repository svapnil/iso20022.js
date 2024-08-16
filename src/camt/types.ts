// Types related to CAMT 053

import { Currency } from 'dinero.js';
import { Account, Agent, Party } from 'lib/types';

export interface Statement {
  id: string;
  electronicSequenceNumber: number;
  legalSequenceNumber: number;
  creationDate: Date;
  fromDate: Date;
  toDate: Date;
  account: Account;
  agent: Agent;
  numOfEntries?: number;
  sumOfEntries?: number;
  netAmountOfEntries?: number;
  // CdtDbtInd is left out because you can calculate it from the entries
  numOfCreditEntries?: number;
  sumOfCreditEntries?: number;
  numOfDebitEntries?: number;
  sumOfDebitEntries?: number;
  balances: Balance[];
  entries: Entry[];
}

export interface Balance {
  date: Date;
  type: BalanceType;
  amount: number;
  // Credit means positive balance, Debit means negative balance
  creditDebitIndicator: 'credit' | 'debit';
  currency: Currency;
}

// NOTE: Excluded fields that may be future work:
export interface Entry {
  referenceId: string;
  creditDebitIndicator: 'credit' | 'debit';
  reversal: boolean;
  bookingDate: Date;
  amount: number;
  currency: Currency;
  proprietaryCode: string;
  transactions: Transaction[];
}

export interface Transaction {
  messageId?: string;
  accountServicerReferenceId?: string;
  paymentInformationId?: string;
  instructionId?: string;
  transactionId?: string;
  instructedAmount?: number;
  instructedCurrency?: Currency;
  proprietaryPurpose?: string;
  debtor?: Party;
  creditor?: Party;
  remittanceInformation?: string;
  returnReason?: string;
  returnAdditionalInformation?: string;
}

/**
 * Balance types as defined in ISO 20022.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
const BalanceTypeCodes = {
  /** Closing balance of amount of money that is at the disposal of the account owner on the date specified. */
  ClosingAvailable: 'CLAV',
  /** Balance of the account at the end of the pre-agreed account reporting period. It is the sum of the opening booked balance at the beginning of the period and all entries booked to the account during the pre-agreed account reporting period. */
  ClosingBooked: 'CLBD',
  /** Forward available balance of money that is at the disposal of the account owner on the date specified. */
  ForwardAvailable: 'FWAV',
  /** Balance for informational purposes. */
  Information: 'INFO',
  /** Available balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. */
  InterimAvailable: 'ITAV',
  /** Balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. */
  InterimBooked: 'ITBD',
  /** Opening balance of amount of money that is at the disposal of the account owner on the date specified. */
  OpeningAvailable: 'OPAV',
  /** Book balance of the account at the beginning of the account reporting period. It always equals the closing book balance from the previous report. */
  OpeningBooked: 'OPBD',
  /** Balance of the account at the previously closed account reporting period. The opening booked balance for the new period has to be equal to this balance. Usage: the previously booked closing balance should equal (inclusive date) the booked closing balance of the date it references and equal the actual booked opening balance of the current date. */
  PreviouslyClosedBooked: 'PRCD',
  /** Balance, composed of booked entries and pending items known at the time of calculation, which projects the end of day balance if everything is booked on the account and no other entry is posted. */
  Expected: 'XPCD',
  /** The difference between the excess/(deficit) investable balance and the excess/(deficit) collected balance due to the reserve requirement. This balance is not used if the account's Earnings Credit Rate is net of reserves. This may be used when the earnings allowance rate is not adjusted for reserves. It may be that reserves have been subtracted from the collected balance to determine the investable balance. Therefore, they must be added back to the excess/(deficit) investable balance to determine the collected balance position. The presentation of this calculation is optional. AFP code=00 04 21 */
  AdditionalBalReserveRequirement: 'ABRR',
} as const;

export type BalanceType =
  (typeof BalanceTypeCodes)[keyof typeof BalanceTypeCodes];
