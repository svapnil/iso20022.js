import {
  array,
  date,
  enum_,
  InferOutput,
  object,
  optional,
  string,
} from 'valibot';
import { optionalWithWarning } from '../../lib/schema/optional-with-warning';
import { CurrencyEnum } from '../../lib/enums/currency.enum';

export const transactionSchema = object({
  // Bank Provider Transaction ID
  providerId: optionalWithWarning(string()),
  amount: string(),
  currency: enum_(CurrencyEnum),
  // Nature Of Transaction (NTRF, WITHDRAWAL)
  type: string(),
  endingBalance: string(),
  date: date(),
  reference: string(),
  description: optionalWithWarning(string()),
  beneficiary: optionalWithWarning(object({
    accountIdentifier: string(),
    metadata: object({
      name: optionalWithWarning(string()),
    }),
  })),
});

export const transactionsSchema = array(transactionSchema);

export type TransactionSchema = InferOutput<typeof transactionSchema>;
