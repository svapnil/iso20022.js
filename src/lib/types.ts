import { Decimal } from "decimal.js"
import { Currency } from "dinero.js"

export interface CreditACHPayment {
    id?: string
    amount: number,
    currency: Currency,
    creditor: Party,
    creditorAccount: Account
}

export interface Party {
    name: string
    address: Address
}

export interface Address {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
}

export interface Account {
    accountNumber: string
    routingNumber: string
    accountType: "checking" | "savings"
}