import { Currency } from 'dinero.js';

/**
 * Represents a balance report in the MT 941 format.
 */
export interface BalanceReport {
  /** Transaction Reference Number (Tag 20) */
  transactionReferenceNumber: string;
  /** Related Reference (Tag 21) - Optional */
  relatedReference?: string;
  /** Account Identification (Tag 25a) */
  accountIdentification: string;
  /** Statement Number/Sequence Number (Tag 28) */
  statementNumber: string;
  /** Date/Time Indication (Tag 13D) - Optional */
  dateTimeIndication?: Date;
  /** Opening Balance (Tag 60F) - Optional */
  openingBalance?: Balance;
  /** Number and Sum of Debit Entries (Tag 90D) - Optional */
  debitEntries?: EntriesSum;
  /** Number and Sum of Credit Entries (Tag 90C) - Optional */
  creditEntries?: EntriesSum;
  /** Book Balance (Tag 62F) */
  bookBalance: Balance;
  /** Closing Available Balance (Tag 64) - Optional */
  closingAvailableBalance?: Balance;
  /** Forward Available Balance (Tag 65) - Optional */
  forwardAvailableBalance?: Balance;
  /** Information to Account Owner (Tag 86) - Optional */
  informationToAccountOwner?: string;
}

/**
 * Represents a balance in the MT 941 format.
 */
export interface Balance {
  /** Indicates whether the balance is credit (C) or debit (D). */
  creditDebitIndicator: 'C' | 'D';
  /** Date of the balance in YYMMDD format. */
  date: Date;
  /** Currency of the balance. */
  currency: Currency;
  /** Amount of the balance. */
  amount: number;
}

/**
 * Represents a sum of entries in the MT 941 format.
 */
export interface EntriesSum {
  /** Number of entries. */
  count: number;
  /** Currency of the entries. */
  currency: Currency;
  /** Sum of the entries. */
  amount: number;
}

/**
 * MT 941 field tags
 */
export enum MT941Tag {
  TransactionReferenceNumber = '20',
  RelatedReference = '21',
  AccountIdentification = '25',
  StatementNumber = '28',
  DateTimeIndication = '13D',
  OpeningBalance = '60F',
  DebitEntries = '90D',
  CreditEntries = '90C',
  BookBalance = '62F',
  ClosingAvailableBalance = '64',
  ForwardAvailableBalance = '65',
  InformationToAccountOwner = '86',
}