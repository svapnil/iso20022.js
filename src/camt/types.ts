// Types related to CAMT 053

import { Currency } from "dinero.js";
import { Account, Agent } from "lib/types";

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
    indicator: "credit" | "debit";
    currency: Currency;
}

export interface Entry {
    date: Date;
    amount: number;
    currency: Currency;
}

// TODO: Add more types
export type BalanceType = "opening" | "closing" | "intermediary";