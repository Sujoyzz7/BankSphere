/**
 * Financial precision utilities.
 * All monetary values are stored as integer minor units.
 * Example: ৳100.50 = 10050 minor units
 */

export const CURRENCY = {
  BDT: { symbol: '৳', decimalPlaces: 2, name: 'Bangladeshi Taka' },
  USD: { symbol: '$', decimalPlaces: 2, name: 'US Dollar' },
  EUR: { symbol: '€', decimalPlaces: 2, name: 'Euro' },
  GBP: { symbol: '£', decimalPlaces: 2, name: 'British Pound' },
} as const;

export type CurrencyCode = keyof typeof CURRENCY;

/**
 * Convert a display amount to minor units.
 * e.g., 100.50 → 10050
 */
export function toMinorUnits(amount: number, currency: CurrencyCode = 'BDT'): number {
  const decimalPlaces = CURRENCY[currency].decimalPlaces;
  return Math.round(amount * Math.pow(10, decimalPlaces));
}

/**
 * Convert minor units to display amount.
 * e.g., 10050 → 100.50
 */
export function toMajorUnits(minorUnits: number, currency: CurrencyCode = 'BDT'): number {
  const decimalPlaces = CURRENCY[currency].decimalPlaces;
  return minorUnits / Math.pow(10, decimalPlaces);
}

/**
 * Format a minor units amount for display.
 * e.g., 10050 → "৳100.50"
 */
export function formatMoney(minorUnits: number, currency: CurrencyCode = 'BDT'): string {
  const major = toMajorUnits(minorUnits, currency);
  const { symbol, decimalPlaces } = CURRENCY[currency];
  return `${symbol}${major.toFixed(decimalPlaces)}`;
}

/**
 * Validate that an amount is a positive integer in minor units.
 */
export function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

/**
 * Add two minor unit amounts.
 */
export function addMoney(a: number, b: number): number {
  return a + b;
}

/**
 * Subtract two minor unit amounts.
 */
export function subtractMoney(a: number, b: number): number {
  if (b > a) {
    throw new Error('Cannot subtract: result would be negative');
  }
  return a - b;
}

/**
 * Calculate a percentage of an amount.
 */
export function percentageOf(amount: number, percent: number): number {
  return Math.round((amount * percent) / 100);
}

/**
 * Calculate compound interest for fixed deposits.
 * Returns the interest earned in minor units.
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  months: number
): number {
  const rate = annualRate / 100;
  const n = 12; // monthly compounding
  const t = months / 12;
  const amount = principal * Math.pow(1 + rate / n, n * t);
  return Math.round(amount) - principal;
}

/**
 * Calculate EMI for a loan.
 * Returns monthly EMI in minor units.
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (annualRate === 0) {
    return Math.round(principal / months);
  }
  const rate = annualRate / 100 / 12;
  const emi =
    (principal * rate * Math.pow(1 + rate, months)) /
    (Math.pow(1 + rate, months) - 1);
  return Math.round(emi);
}
