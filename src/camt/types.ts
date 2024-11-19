// Types related to CAMT 053

import { Currency } from 'dinero.js';
import { Account, Agent, Party } from '../lib/types';

/**
 * Represents a bank statement in the CAMT.053 format.
 */
export interface Statement {
  /** Unique identifier for the statement. */
  id: string;
  /** Electronic sequence number of the statement. */
  electronicSequenceNumber: number;
  /** Legal sequence number of the statement. */
  legalSequenceNumber: number;
  /** Date and time when the statement was created. */
  creationDate: Date;
  /** Start date of the statement period. */
  fromDate?: Date;
  /** End date of the statement period. */
  toDate?: Date;
  /** Account details for which the statement is generated. */
  account: Account;
  /** Financial institution details. */
  agent: Agent;
  /** Total number of entries in the statement. */
  numOfEntries?: number;
  /** Sum of all entries in the statement. */
  sumOfEntries?: number;
  /** Net amount of all entries in the statement. */
  netAmountOfEntries?: number;
  /** Number of credit entries in the statement. */
  numOfCreditEntries?: number;
  /** Sum of all credit entries in the statement. */
  sumOfCreditEntries?: number;
  /** Number of debit entries in the statement. */
  numOfDebitEntries?: number;
  /** Sum of all debit entries in the statement. */
  sumOfDebitEntries?: number;
  /** Array of balance information. */
  balances: Balance[];
  /** Array of transaction entries. */
  entries: Entry[];
}

/**
 * Represents a balance in the statement, delinated by date and type.
 */
export interface Balance {
  /** Date of the balance. */
  date: Date;
  /** Type of the balance. */
  type: BalanceType;
  /** Amount of the balance. */
  amount: number;
  /** Indicates whether the balance is credit (positive) or debit (negative). */
  creditDebitIndicator: 'credit' | 'debit';
  /** Currency of the balance. */
  currency: Currency;
}

// NOTE: Excluded fields that may be future work:
/**
 * Represents a transaction entry in the statement.
 */
export interface Entry {
  /** Unique reference ID for the entry, if included in the statement. */
  referenceId?: string;
  /** Indicates whether the entry is a credit or debit. */
  creditDebitIndicator: 'credit' | 'debit';
  /** Indicates if the entry is a reversal. */
  reversal: boolean;
  /** Date when the entry was booked. */
  bookingDate: Date;
  /** Amount of the entry. */
  amount: number;
  /** Currency of the entry. */
  currency: Currency;
  /** Proprietary code associated with the entry. */
  proprietaryCode: string;
  /** Array of individual transactions within this entry. */
  transactions: Transaction[];
  /** Additional entry information */
  additionalInformation?: string;
  /** Reference ID assigned by the account servicer. */
  accountServicerReferenceId?: string;
  /** Details about the type of transaction */
  bankTransactionCode: BankTransactionCode;
}

/**
 * Represents an individual transaction within an entry.
 */
export interface Transaction {
  /** Unique message ID for the transaction. */
  messageId?: string;
  /** Reference ID assigned by the account servicer. */
  accountServicerReferenceId?: string;
  /** ID of the payment information. */
  paymentInformationId?: string;
  /** Instruction ID for the transaction. */
  instructionId?: string;
  /** Unique transaction ID. */
  transactionId?: string;
  /** Instructed amount for the transaction. */
  instructedAmount?: number;
  /** Currency of the instructed amount. */
  instructedCurrency?: Currency;
  /** Proprietary purpose code for the transaction. */
  proprietaryPurpose?: string;
  /** Details of the debtor party. */
  debtor?: Party;
  /** Details of the creditor party. */
  creditor?: Party;
  /** Additional information about the remittance. */
  remittanceInformation?: string;
  /** Reason for return, if applicable. */
  returnReason?: string;
  /** Additional information about the return. */
  returnAdditionalInformation?: string;
}

// NOTE: We should consider creating DomainCode, FamilyCode, and SubFamilyCode types from:
// https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets
export interface BankTransactionCode {
  /** Specifies the business area of the underlying transaction. */
  domainCode?: string;
  /** Specifies the family within the domain of the underlying transaction.  */
  domainFamilyCode?: string;
  /** Specifies the sub-product family within a specific family of the underlying transaction. */
  domainSubFamilyCode?: string;
  /** Bank transaction code in a proprietary form, as defined by the issuer. */
  proprietaryCode?: string;
  /** Identification of the issuer of the proprietary bank transaction code. */
  proprietaryCodeIssuer?: string;
}

/**
 * Balance types as defined in ISO 20022.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
export const BalanceTypeCode = {
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
  (typeof BalanceTypeCode)[keyof typeof BalanceTypeCode];
