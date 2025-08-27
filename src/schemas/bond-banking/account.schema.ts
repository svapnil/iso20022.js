import {
  array,
  date,
  enum_,
  InferOutput,
  intersect,
  object,
  string,
} from 'valibot';
import { optionalWithWarning } from '../../lib/schema/optional-with-warning';
import { CurrencyEnum } from '../../lib/enums/currency.enum';
import { transactionSchema } from './transaction.schema';

export const accountSchema = object({
  // Account Identifier (IBAN, Account Number)
  accountIdentifier: string(),
  currency: enum_(CurrencyEnum),
  openingBalance: optionalWithWarning(
    object({
      amount: string(),
      date: date(),
    }),
  ),
  closingBalance: optionalWithWarning(
    object({
      amount: string(),
      date: date(),
    }),
  ),
});

export const accountSchemaWithTransactions = intersect([
  accountSchema,
  object({
    transactions: optionalWithWarning(array(transactionSchema)),
  }),
]);

export type AccountSchema = InferOutput<typeof accountSchema>;

export type AccountSchemaWithTransactions = InferOutput<typeof accountSchemaWithTransactions>;