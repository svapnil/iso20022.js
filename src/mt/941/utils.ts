import { Balance, EntriesSum, MT941Tag } from '../types';
import { Currency } from 'dinero.js';
import { parseAmountToMinorUnits } from '../../parseUtils';

/**
 * Parses a date string in YYMMDD format to a Date object.
 * @param dateStr - The date string in YYMMDD format.
 * @returns A Date object.
 */
export const parseDate = (dateStr: string): Date => {
  const year = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4)) - 1; // JavaScript months are 0-indexed
  const day = parseInt(dateStr.substring(4, 6));
  
  // Determine century (assume 20xx for years less than 50, 19xx otherwise)
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  
  return new Date(fullYear, month, day);
};

/**
 * Parses a date and time string in YYMMDD[HHMM] format to a Date object.
 * @param dateTimeStr - The date and time string in YYMMDD[HHMM] format.
 * @returns A Date object.
 */
export const parseDateTime = (dateTimeStr: string): Date => {
  const date = parseDate(dateTimeStr.substring(0, 6));
  
  // If time is provided, add it to the date
  if (dateTimeStr.length >= 10) {
    const hour = parseInt(dateTimeStr.substring(6, 8));
    const minute = parseInt(dateTimeStr.substring(8, 10));
    date.setHours(hour, minute);
  }
  
  return date;
};

/**
 * Parses a balance field from the MT 941 format.
 * Format: 1!a6!n3!a15d
 * Example: C200430USD123456,78
 * 
 * @param field - The balance field value.
 * @returns A Balance object.
 */
export const parseBalance = (field: string): Balance => {
  const creditDebitIndicator = field.substring(0, 1) as 'C' | 'D';
  const dateStr = field.substring(1, 7);
  const currency = field.substring(7, 10) as Currency;
  const amountStr = field.substring(10);
  
  // Convert amount string to number (handle decimal separator)
  const amount = parseAmountToMinorUnits(
    parseFloat(amountStr.replace(',', '.')),
    currency
  );
  
  return {
    creditDebitIndicator,
    date: parseDate(dateStr),
    currency,
    amount
  };
};

/**
 * Parses an entries sum field from the MT 941 format.
 * Format: 5n3!a15d
 * Example: 00123USD456789,01
 * 
 * @param field - The entries sum field value.
 * @returns An EntriesSum object.
 */
export const parseEntriesSum = (field: string): EntriesSum => {
  const count = parseInt(field.substring(0, 5));
  const currency = field.substring(5, 8) as Currency;
  const amountStr = field.substring(8);
  
  // Convert amount string to number (handle decimal separator)
  const amount = parseAmountToMinorUnits(
    parseFloat(amountStr.replace(',', '.')),
    currency
  );
  
  return {
    count,
    currency,
    amount
  };
};

/**
 * Validates that all currency codes in the balance fields are consistent.
 * According to MT 941 Network Validated Rules C1, the first two characters of the 
 * three character currency code in fields 60F, 90D, 90C, 62F, 64 and 65 must be 
 * the same for all occurrences of these fields.
 * 
 * @param currencies - Array of currency codes to validate.
 * @returns True if all currency codes are consistent, false otherwise.
 */
export const validateCurrencyConsistency = (currencies: Currency[]): boolean => {
  if (currencies.length <= 1) {
    return true;
  }
  
  const firstTwoChars = currencies[0].substring(0, 2);
  
  return currencies.every(currency => currency.substring(0, 2) === firstTwoChars);
};

/**
 * Parses a statement number field from the MT 941 format.
 * Format: 5n[/2n]
 * Example: 12345/01
 * 
 * @param field - The statement number field value.
 * @returns The parsed statement number as a string.
 */
export const parseStatementNumber = (field: string): string => {
  return field;
};

/**
 * Parses a date/time indication field from the MT 941 format.
 * Format: 6!n4!n1!x4!n
 * Example: 2004301200+0100
 * 
 * @param field - The date/time indication field value.
 * @returns A Date object.
 */
export const parseDateTimeIndication = (field: string): Date => {
  const dateStr = field.substring(0, 6);
  const timeStr = field.substring(6, 10);
  const sign = field.substring(10, 11);
  const timezone = field.substring(11, 15);
  
  const date = parseDate(dateStr);
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));
  
  date.setHours(hour, minute);
  
  // Adjust for timezone if needed
  // This is a simplified approach and might not handle all timezone cases correctly
  if (sign === '+' || sign === '-') {
    const tzHours = parseInt(timezone.substring(0, 2));
    const tzMinutes = parseInt(timezone.substring(2, 4));
    const tzOffset = (tzHours * 60 + tzMinutes) * (sign === '+' ? -1 : 1);
    
    date.setMinutes(date.getMinutes() + tzOffset);
  }
  
  return date;
};