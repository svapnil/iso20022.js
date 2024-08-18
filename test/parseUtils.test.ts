import { parseAmountToMinorUnits } from '../src/parseUtils';


// TODO: Continue adding some testing for currencies that have a precision of NOT 2
describe('parseAmountToMinorUnits', () => {
  test('converts USD amount to minor units', () => {
    expect(parseAmountToMinorUnits(10.50, 'USD')).toBe(1050);
    expect(parseAmountToMinorUnits(0.01, 'USD')).toBe(1);
    expect(parseAmountToMinorUnits(100, 'USD')).toBe(10000);
  });

  // Figure out why JPY has a precision of 2, instead of 0
  test('converts JPY amount to minor units', () => {
    expect(parseAmountToMinorUnits(100000, 'JPY')).toBe(10000000);
  });

  test('handles string input for amount', () => {
    expect(parseAmountToMinorUnits('10.50' as any, 'USD')).toBe(1050);
  });

  test('uses USD as default currency', () => {
    expect(parseAmountToMinorUnits(10.50)).toBe(1050);
    expect(parseAmountToMinorUnits(0.01)).toBe(1);
  });
});
