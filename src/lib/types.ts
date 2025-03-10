import { Currency } from 'dinero.js';
import { Alpha2Country } from './countries';

/**
 * Represents a payment instruction with essential details.
 */
export interface PaymentInstruction {
  /** Unique identifier for the payment instruction. */
  id?: string;
  /** Unique end-to-end identifier for the payment. */
  endToEndId?: string;
  /** Indicates whether the payment is a credit or debit. */
  direction?: 'credit' | 'debit';
  /** The amount of the payment. Usually in cents. */
  amount: number;
  /** The currency of the payment. */
  currency: Currency;
  /** The party from which the payment is debited. */
  debtor?: Party;
  /** The party to which the payment is credited. */
  creditor?: Party;
  /** Additional information about the payment. */
  remittanceInformation?: string;
}

/**
 * Represents a credit payment instruction, extending the base PaymentInstruction.
 */
export interface CreditPaymentInstruction extends PaymentInstruction {
  direction?: 'credit';
  creditor: Party;
}

/**
 * Represents a SWIFT credit payment instruction, extending the base PaymentInstruction.
 */
export interface SWIFTCreditPaymentInstruction extends CreditPaymentInstruction {
  /** Specifies that this is a SWIFT payment. */
  type?: 'swift';
}

export interface SEPACreditPaymentInstruction extends CreditPaymentInstruction {
  type?: 'sepa',
  currency: 'EUR',
}

export interface RTPCreditPaymentInstruction extends CreditPaymentInstruction {
  type?: 'rtp',
  currency: 'USD',
}

/**
 * Represents an ACH credit payment instruction, extending the base PaymentInstruction.
 */
export interface ACHCreditPaymentInstruction extends CreditPaymentInstruction {
  /** Specifies that this is an ACH payment. */
  type?: 'ach',
  /** ACH payments must use USD as currency. */
  currency: 'USD',
}

/*
 * Represents a SEPA credit payment instruction, extending the base PaymentInstruction.
 */
/**
 * Category purpose codes as defined in ISO 20022 ExternalCategoryPurpose1Code.
 * @see {@link https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets}
 */
export const ExternalCategoryPurposeCode = {
  /** Transaction is the payment of a bonus */
  Bonus: 'BONU',
  /** Transaction is a general cash management instruction */
  CashManagement: 'CASH',
  /** A service that is settling money for a bulk of card transactions */
  CardBulk: 'CBLK',
  /** Transaction is related to a payment of credit card */
  CreditCard: 'CCRD',
  /** Transaction is related to settlement of a trade */
  TradeSettlement: 'CORT',
  /** Transaction is related to a payment of debit card */
  DebitCard: 'DCRD',
  /** Transaction is the payment of dividends */
  Dividends: 'DIVI',
  /** Code used to pre-advise forthcoming deliver against payment instruction */
  DeliverAgainstPayment: 'DVPM',
  /** Transaction is related to ePayment */
  EPayment: 'EPAY',
  /** Transaction is related to the payment of a fee and interest */
  FeeAndInterest: 'FCIN',
  /** A service that is settling card transaction related fees between two parties */
  CardFeeSettlement: 'FCOL',
  /** General Person-to-Person Payment */
  GeneralP2P: 'GP2P',
  /** Transaction is a payment to or from a government department */
  Government: 'GOVT',
  /** Transaction is related to the payment of a hedging operation */
  Hedging: 'HEDG',
  /** Transaction is reimbursement of credit card payment */
  CreditCardReimbursement: 'ICCP',
  /** Transaction is reimbursement of debit card payment */
  DebitCardReimbursement: 'IDCP',
  /** Transaction is an intra-company payment */
  IntraCompany: 'INTC',
  /** Transaction is the payment of interest */
  Interest: 'INTE',
  /** Transaction is related to identify cash handling via Night Safe or Lockbox */
  Lockbox: 'LBOX',
  /** Transaction is related to the transfer of a loan to a borrower */
  Loan: 'LOAN',
  /** Mobile P2B Payment */
  MobileP2B: 'MP2B',
  /** Mobile P2P Payment */
  MobileP2P: 'MP2P',
  /** Other payment purpose */
  Other: 'OTHR',
  /** Transaction is the payment of pension */
  Pension: 'PENS',
  /** Collection used to re-present previously reversed or returned direct debit transactions */
  Represent: 'RPRE',
  /** Transaction is related to a reimbursement for commercial reasons */
  CommercialReimbursement: 'RRCT',
  /** Code used to pre-advise forthcoming receive against payment instruction */
  ReceiveAgainstPayment: 'RVPM',
  /** Transaction is the payment of salaries */
  Salary: 'SALA',
  /** Transaction is the payment of securities */
  Securities: 'SECU',
  /** Transaction is a social security benefit */
  SocialSecurityBenefit: 'SSBE',
  /** Transaction is related to a payment to a supplier */
  Supplier: 'SUPP',
  /** Transaction is the payment of taxes */
  Taxes: 'TAXS',
  /** Transaction is related to the payment of a trade finance transaction */
  Trade: 'TRAD',
  /** Transaction is related to treasury operations */
  Treasury: 'TREA',
  /** Transaction is the payment of value added tax */
  VAT: 'VATX',
  /** Transaction is the payment of withholding tax */
  WithholdingTax: 'WHLD',
  /** Transaction relates to a cash management sweep instruction */
  Sweep: 'SWEP',
  /** Transaction relates to a cash management top-up instruction */
  TopUp: 'TOPG',
  /** Transaction relates to a zero balance account instruction */
  ZeroBalance: 'ZABA',
  /** Transaction to be processed as a domestic payment instruction from foreign bank */
  DomesticFromForeign: 'VOST',
  /** Foreign Currency Transaction between domestic financial institutions */
  ForeignCurrencyDomestic: 'FCDT',
  /** Transaction is a direct debit for a cash order of notes and/or coins */
  CashOrder: 'CIPC',
  /** Transaction is a direct debit for a cash order of notes and/or coins */
  CashOrderConsolidated: 'CONC',
  /** Transaction is a payment for cash collection by Cash in Transit company */
  CashInTransit: 'CGWV',
  /** Transfer to/from savings or retirement account */
  Savings: 'SAVG',
  /** Cross border transaction subject to Dodd Frank 1073 */
  CrossBorderDoddFrank: 'CTDF',
} as const;

/**
 * Description mapping of ExternalCategoryPurposeCode values to their names.
 */
export const ExternalCategoryPurposeCodeDescriptionMap = {
  'BONU': 'Bonus Payment',
  'CASH': 'Cash Management',
  'CBLK': 'Card Bulk Settlement',
  'CCRD': 'Credit Card Payment',
  'CORT': 'Trade Settlement',
  'DCRD': 'Debit Card Payment',
  'DIVI': 'Dividends',
  'DVPM': 'Deliver Against Payment',
  'EPAY': 'Electronic Payment',
  'FCIN': 'Fee and Interest',
  'FCOL': 'Card Fee Settlement',
  'GP2P': 'General Person-to-Person',
  'GOVT': 'Government Payment',
  'HEDG': 'Hedging Operation',
  'ICCP': 'Credit Card Reimbursement',
  'IDCP': 'Debit Card Reimbursement',
  'INTC': 'Intra-Company Payment',
  'INTE': 'Interest Payment',
  'LBOX': 'Lockbox',
  'LOAN': 'Loan Transfer',
  'MP2B': 'Mobile Person-to-Business',
  'MP2P': 'Mobile Person-to-Person',
  'OTHR': 'Other',
  'PENS': 'Pension Payment',
  'RPRE': 'Re-Present Transaction',
  'RRCT': 'Commercial Reimbursement',
  'RVPM': 'Receive Against Payment',
  'SALA': 'Salary Payment',
  'SECU': 'Securities Payment',
  'SSBE': 'Social Security Benefit',
  'SUPP': 'Supplier Payment',
  'TAXS': 'Tax Payment',
  'TRAD': 'Trade Finance',
  'TREA': 'Treasury Operation',
  'VATX': 'Value Added Tax',
  'WHLD': 'Withholding Tax',
  'SWEP': 'Sweep Instruction',
  'TOPG': 'Top-up Instruction',
  'ZABA': 'Zero Balance',
  'VOST': 'Domestic from Foreign',
  'FCDT': 'Foreign Currency Domestic',
  'CIPC': 'Cash Order',
  'CONC': 'Cash Order Consolidated',
  'CGWV': 'Cash in Transit',
  'SAVG': 'Savings Transfer',
  'CTDF': 'Cross Border Dodd Frank',
} as const;

export type ExternalCategoryPurpose =
  (typeof ExternalCategoryPurposeCode)[keyof typeof ExternalCategoryPurposeCode];

/**
 * Represents a structured address format.
 */
export interface StructuredAddress {
  /** The name of the street. */
  streetName?: string;
  /** The building number on the street. */
  buildingNumber?: string;
  /** The name of the town or city. */
  townName?: string;
  /** The subdivision of the country (e.g., state, province). */
  countrySubDivision?: string;
  /** The postal or ZIP code. */
  postalCode?: string;
  /** The country, typically represented by a country code. */
  country?: Alpha2Country;
}

/**
 * Represents a party involved in a payment transaction.
 */
export interface Party {
  /** Unique identifier for the party. */
  id?: string;
  /** The name of the party. */
  name?: string;
  /** The structured address of the party. */
  address?: StructuredAddress;
  /** The account details of the party. */
  account?: Account;
  /** The financial agent (e.g., bank) of the party. */
  agent?: Agent;
}

/**
 * Represents an account identified by IBAN.
 */
export interface IBANAccount {
  /** The International Bank Account Number. */
  iban: string;
}

/**
 * Represents a basic account with account number and optional type.
 */
export interface BaseAccount {
  /** The account number. */
  accountNumber: string;
  /** The type of the account. */
  accountType?: 'checking' | 'savings';
  /** The currency of the account. */
  currency?: Currency;
  /** The name of the account. */
  name?: string;
}

/**
 * Represents either an IBAN account or a basic account.
 */
export type Account = IBANAccount | BaseAccount;

/**
 * Represents a financial agent identified by BIC.
 */
export interface BICAgent {
  /** The Bank Identifier Code. */
  bic: string;
  /** The structured address of the bank. */
  bankAddress?: StructuredAddress;
}

/**
 * Represents a financial agent identified by ABA routing number.
 */
export interface ABAAgent {
  /** The ABA routing number. */
  abaRoutingNumber: string;
}

/**
 * Represents either a BIC or ABA identified financial agent.
 * NOTE: Sometimes an agent can include both a BIC and ABA routing number.
 * This library does not support that yet, but we will need to.
 */
export type Agent = BICAgent | ABAAgent;

/**
 * ACH Local Instrument Codes as defined in NACHA standards.
 * These codes identify the specific type of ACH transaction.
 */
export const ACHLocalInstrumentCode = {
  /** Corporate Credit or Debit */
  CorporateCreditDebit: 'CCD',
  /** Prearranged Payment and Deposit */
  PrearrangedPaymentDeposit: 'PPD',
  /** Internet-Initiated Entry */
  InternetInitiated: 'WEB',
  /** Telephone-Initiated Entry */
  TelephoneInitiated: 'TEL',
  /** Point-of-Purchase Entry */
  PointOfPurchase: 'POP',
  /** Accounts Receivable Entry */
  AccountsReceivable: 'ARC',
  /** Back Office Conversion */
  BackOfficeConversion: 'BOC',
  /** Represented Check Entry */
  RepresentedCheck: 'RCK',
} as const;

export type ACHLocalInstrument = 
  (typeof ACHLocalInstrumentCode)[keyof typeof ACHLocalInstrumentCode];

export const ACHLocalInstrumentCodeDescriptionMap = {
  'CCD': 'Corporate Credit or Debit',
  'PPD': 'Prearranged Payment and Deposit',
  'WEB': 'Internet-Initiated Entry',
  'TEL': 'Telephone-Initiated Entry',
  'POP': 'Point-of-Purchase Entry',
  'ARC': 'Accounts Receivable Entry',
  'BOC': 'Back Office Conversion',
  'RCK': 'Represented Check Entry',
} as const;