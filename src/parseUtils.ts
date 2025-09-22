import { Account, AccountIdentification, AccountIdentificationIBAN, AccountIdentificationOther, Agent, BaseAccount, IBANAccount, MessageHeader, Party, StructuredAddress } from 'lib/types';
import { getCurrencyPrecision } from './lib/currencies';
import Dinero, { Currency } from 'dinero.js';

export const parseAccount = (account: any): Account => {
  // Return just IBAN if it exists, else detailed local account details
  if (account.Id.IBAN) {
    return {
      iban: account.Id.IBAN,
    } as Account;
  }
  // TODO: Add support for .Tp.Cd and .Tp.Prtry
  return {
    ...(account.Id?.Othr?.Id && { accountNumber: String(account.Id.Othr.Id) }),
    ...(account.Nm && { name: account.Nm }),
    ...(account.Ccy && { currency: account.Ccy }),
  } as Account;
};

export const exportAccount = (
  account: Account
): any => {
  const obj: any = {};
  if ((account as any).iban) {
    obj.Id = { IBAN: (account as IBANAccount).iban };
  } else {
    obj.Id = {
      Othr: {
        Id: (account as BaseAccount).accountNumber,
      },
    };
    obj.Ccy = (account as BaseAccount).currency;
    obj.Nm = (account as BaseAccount).name;
  }

  return obj;
};

export const parseAccountIdentification = (accountId: any): AccountIdentification => {
  if (accountId.IBAN) {
    return {
      iban: accountId.IBAN,
    } as AccountIdentificationIBAN;
  } else {
    return {
      id: accountId.Othr?.Id,
      schemeName: accountId.Othr?.SchmeNm?.Cd || accountId.Othr?.SchmeNm?.Prtry,
      issuer: accountId.Othr?.Issr,
    } as AccountIdentificationOther;
  }
}

export const exportAccountIdentification = (accountId: AccountIdentification): any => {
  if ((accountId as any).iban) {
    return { IBAN: (accountId as AccountIdentificationIBAN).iban };
  } else {
    const obj: any = {
      Othr: {
        Id: (accountId as AccountIdentificationOther).id,
      }
    };
    if ((accountId as AccountIdentificationOther).schemeName) {
      obj.Othr.SchmeNm = { Cd: (accountId as AccountIdentificationOther).schemeName }; // TODO: Add support for Prtry scheme name
    }
    if ((accountId as AccountIdentificationOther).issuer) {
      obj.Othr.Issr = (accountId as AccountIdentificationOther).issuer;
    }
    return obj;
  }
}

// TODO: Add both BIC and ABA routing numbers at the same time
export const parseAgent = (agent: any): Agent => {
  // Get BIC if it exists first
  if (agent.FinInstnId.BIC) {
    return {
      bic: agent.FinInstnId.BIC,
    } as Agent;
  }

  return {
    abaRoutingNumber: (agent.FinInstnId.Othr?.Id || agent.FinInstnId.ClrSysMmbId.MmbId).toString(),
  } as Agent;
};

export const exportAgent = (agent: Agent): any => {
  const obj: any = {
    FinInstnId: {},
  };
  if ((agent as any).bic) {
    obj.FinInstnId.BIC = (agent as any).bic;
  } else if ((agent as any).abaRoutingNumber) {
    obj.FinInstnId.Othr = { Id: (agent as any).abaRoutingNumber };
  }
  return obj;
};

// Parse raw currency data, turn into Dinero object and turn into minor units
export const parseAmountToMinorUnits = (
  rawAmount: number,
  currency: Currency = 'USD',
): number => {
  const currencyObject = Dinero({
    currency: currency,
    precision: getCurrencyPrecision(currency),
  });
  // Also make sure Javascript number parsing error do not happen.
  return Math.floor(Number(rawAmount) * 10 ** currencyObject.getPrecision());
};

export const exportAmountToString = (
  amount: number,
  currency: Currency = 'USD',
): string => {
  const currencyObject = Dinero({
    amount,
    currency: currency,
    precision: getCurrencyPrecision(currency),
  });
  const precision = currencyObject.getPrecision();
  const zeroes = '0'.repeat(precision);
  return currencyObject.toFormat('0'+(zeroes.length > 0 ? '.'+zeroes : ''));
}

export const parseDate = (dateElement: any): Date => {
  // Find the date element, which can be DtTm or Dt
  const date = dateElement.DtTm || dateElement.Dt || dateElement;
  return new Date(date);
};

export const parseParty = (party: any): Party => {
  return {
    id: party.Id?.OrgId?.Othr?.Id,
    name: party.Nm,
  } as Party;
};

export const parseRecipient = (recipient: any): {
  id?: string;
  name?: string;
  address?: StructuredAddress
} => {
  return {
    id: recipient.Id?.OrgId?.Othr?.Id,
    name: recipient.Nm,
  };
};

export const exportRecipient = (recipient: ReturnType<typeof parseRecipient>): any => {
  return {
    Id: recipient.id ? { OrgId: { Othr: { Id: recipient.id } } } : undefined,
    Nm: recipient.name,
  }
}

// Standardize into a single string
export const parseAdditionalInformation = (
  additionalInformation: any,
): string | undefined => {
  if (!additionalInformation) {
    return undefined;
  }

  if (Array.isArray(additionalInformation)) {
    return additionalInformation.join('\n');
  } else {
    return additionalInformation;
  }
};


export const parseMessageHeader = (rawHeader: any): MessageHeader => {
  return {
    id: rawHeader.MsgId,
    creationDateTime: rawHeader.CreDtTm? parseDate(rawHeader.CreDtTm): undefined,
    queryName: rawHeader.QueryNm,
    requestType: rawHeader.ReqTp?.PmtCtrl || rawHeader.ReqTp?.Enqry || rawHeader.ReqTp?.Prtry,
    originalMessageHeader: rawHeader.OrgnlBizQry ? parseMessageHeader(rawHeader.OrgnlBizQry) : undefined,
  };
}

export const exportMessageHeader = (header: MessageHeader): any => {
  const obj: any = {
    MsgId: header.id,
    CreDtTm: header.creationDateTime?.toISOString(),
  };
  if (header.originalMessageHeader) {
    obj.OrgnlMsgHdr = exportMessageHeader(header.originalMessageHeader as MessageHeader);
  }
  if (header.requestType) {
    obj.ReqTp = { Prtry: header.requestType }; // TODO: Add support for PmtCtrl and Enqry types
  }
  if (header.queryName) {
    obj.QueryNm = header.queryName;
  }
  return obj;
}