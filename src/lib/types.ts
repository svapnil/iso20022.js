import { Decimal } from "decimal.js"
import { Currency } from "dinero.js"

/**
 * Represents a payment instruction with essential details.
 */
export interface PaymentInstruction {
    /** Unique identifier for the payment instruction. */
    id?: string;
    /** Indicates whether the payment is a credit or debit. */
    direction: 'credit' | 'debit';
    /** The amount of the payment. */
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
 * Represents a SWIFT credit payment instruction, extending the base PaymentInstruction.
 */
export interface SWIFTCreditPaymentInstruction extends PaymentInstruction {
    /** Specifies that this is a SWIFT payment. */
    type: 'swift';
    /** SWIFT payments are always credit payments. */
    direction: 'credit';
    /** The party to which the payment is credited (required for SWIFT payments). */
    creditor: Party;
}

/**
 * Represents a structured address format.
 */
export interface StructuredAddress {
    /** The name of the street. */
    streetName?: string
    /** The building number on the street. */
    buildingNumber?: string
    /** The name of the town or city. */
    townName?: string
    /** The subdivision of the country (e.g., state, province). */
    countrySubDivision?: string
    /** The postal or ZIP code. */
    postalCode?: string
    /** The country, typically represented by a country code. */
    country?: string
}

/**
 * Represents a party involved in a payment transaction.
 */
export interface Party {
    /** Unique identifier for the party. */
    id?: string
    /** The name of the party. */
    name?: string
    /** The structured address of the party. */
    address?: StructuredAddress
    /** The account details of the party. */
    account?: Account
    /** The financial agent (e.g., bank) of the party. */
    agent?: Agent
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
    accountType?: "checking" | "savings"
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
    routingNumber: string;
}

/**
 * Represents either a BIC or ABA identified financial agent.
 */
export type Agent = BICAgent | ABAAgent;