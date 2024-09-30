import { Account, Agent, Party } from 'lib/types';
import Dinero, { Currency } from 'dinero.js';

export const parseAccount = (account: any): Account => {
  // Return just IBAN if it exists, else detailed local account details
  if (account.Id.IBAN) {
    return {
      iban: account.Id.IBAN,
    } as Account;
  }

  return {
    ...(account.Id?.Othr?.Id && { accountNumber: String(account.Id.Othr.Id) }),
    ...(account.Nm && { name: account.Nm }),
    ...(account.Ccy && { currency: account.Ccy }),
  } as Account;
};

// TODO: Add both BIC and ABA routing numbers at the same time
export const parseAgent = (agent: any): Agent => {
  // Get BIC if it exists first
  if (agent.FinInstnId.BIC) {
    return {
      bic: agent.FinInstnId.BIC,
    } as Agent;
  }

  return {
    routingNumber: agent.FinInstnId.Othr.Id,
  } as Agent;
};

// Parse raw currency data, turn into Dinero object and turn into minor units
export const parseAmountToMinorUnits = (
  rawAmount: number,
  currency: Currency = 'USD',
): number => {
  const currencyObject = Dinero({
    currency: currency,
  });
  return Number(rawAmount) * 10 ** currencyObject.getPrecision();
};

export const parseDate = (dateElement: any): Date => {
  // Find the date element, which can be DtTm or Dt
  const date = dateElement.DtTm || dateElement.Dt;
  return new Date(date);
};

export const parseParty = (party: any): Party => {
  return {
    id: party.Id?.OrgId?.Othr?.Id,
    name: party.Nm,
  } as Party;
};
