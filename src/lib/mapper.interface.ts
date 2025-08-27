import {
  AccountSchema,
  AccountSchemaWithTransactions,
} from '../schemas/bond-banking/account.schema';
import { TransactionSchema } from '../schemas/bond-banking/transaction.schema';

export interface IMapper<T> {
  /**
   * Parse the input and return an account schema.
   * @param input - The input to parse.
   * @returns The account schema.
   * @description This method will parse the input and return an account with transactions.
   */
  parse(input: T): AccountSchemaWithTransactions[];

  /**
   * Parse the input and return an account schema.
   * @param input - The input to parse.
   * @returns The account schema.
   * @description This method will parse the input and return an account without transactions.
   */
  parseAccounts(input: T): AccountSchema[];

  /**
   * Parse the input and return a transaction schema.
   * @param input - The input to parse.
   * @returns The transaction schema.
   * @description This method will parse the input and return an array of transactions.
   */
  parseTransactions(input: T): TransactionSchema[];
}
