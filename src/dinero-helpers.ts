import { dinero, add, toDecimal, type Dinero, type DineroSnapshot } from 'dinero.js';
import { getCurrencyPrecision } from './lib/currencies';
import { Currency } from './lib/currency';

type DineroCurrency = { code: string; base: number; exponent: number };

export function currencyObj(code: Currency): DineroCurrency {
  return { code, base: 10, exponent: getCurrencyPrecision(code) };
}

export function createDinero(amount: number, currency: Currency) {
  return dinero({ amount, currency: currencyObj(currency) });
}

export function formatDinero(d: Dinero<number>): string {
  return toDecimal(d, ({ value, currency }) => {
    const exponent = currency.exponent;
    const parts = value.split('.');
    const intPart = parts[0];
    const decPart = (parts[1] || '').padEnd(exponent, '0');
    return exponent > 0 ? `${intPart}.${decPart}` : intPart;
  });
}

export function formatAmount(amount: number, currency: Currency): string {
  return formatDinero(createDinero(amount, currency));
}

export function sumAmounts(amounts: number[], currency: Currency): string {
  const curr = currencyObj(currency);
  const dineros = amounts.map(amount => dinero({ amount, currency: curr }));
  const total = dineros.reduce((acc, next) => add(acc, next));
  return formatDinero(total);
}
