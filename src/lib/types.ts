import { Decimal } from "decimal.js"
import { Currency } from "dinero.js"

export interface PaymentInstruction {
    id?: string;
    direction: 'credit' | 'debit';
    amount: number;
    currency: Currency;
    debtor?: Party;
    creditor?: Party;
    remittanceInformation?: string;
}

export interface SWIFTCreditPaymentInstruction extends PaymentInstruction {
    type: 'swift';
    direction: 'credit';
    creditor: Party;
}

export interface StructuredAddress {
    streetName?: string
    buildingNumber?: string
    townName?: string
    countrySubDivision?: string
    postalCode?: string
    country?: string
}

export interface Party {
    id?: string
    name?: string
    address?: StructuredAddress
    account?: Account
    agent?: Agent
}

export interface IBANAccount {
    iban: string;
}

export interface BaseAccount {
    accountNumber: string;
    accountType?: "checking" | "savings"
}

export type Account = IBANAccount | BaseAccount;

export interface BICAgent {
    bic: string;
    bankAddress?: StructuredAddress;
}

export interface ABAAgent {
    routingNumber: string;
}

export type Agent = BICAgent | ABAAgent;