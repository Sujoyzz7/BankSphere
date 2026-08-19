import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  calculateEMI,
  calculateCompoundInterest,
} from './money';

describe('Financial Money Utilities', () => {
  it('converts major units (BDT) to minor units (paisa) correctly', () => {
    expect(toMinorUnits(100)).toBe(10000);
    expect(toMinorUnits(100.5)).toBe(10050);
    expect(toMinorUnits(0.01)).toBe(1);
    expect(toMinorUnits(0)).toBe(0);
  });

  it('converts minor units to major units correctly', () => {
    expect(toMajorUnits(10000)).toBe(100);
    expect(toMajorUnits(10050)).toBe(100.5);
    expect(toMajorUnits(1)).toBe(0.01);
  });

  it('formats currency for display', () => {
    const formatted = formatMoney(10050, 'BDT');
    expect(formatted).toContain('100.50');
  });

  it('calculates Loan Equal Monthly Installment (EMI) accurately', () => {
    // 200,000 BDT loan, 10% annual interest, 24 months tenure
    const principalMinor = 20000000;
    const emiMinor = calculateEMI(principalMinor, 10, 24);
    expect(emiMinor).toBeGreaterThan(0);
    // EMI should be around 9229 BDT per month = ~922899 minor units
    expect(toMajorUnits(emiMinor)).toBeGreaterThan(9000);
    expect(toMajorUnits(emiMinor)).toBeLessThan(9500);
  });

  it('calculates compound interest for Fixed Deposits accurately', () => {
    // 100,000 BDT deposit, 8% interest, 12 months tenure
    const depositMinor = 10000000;
    const interestMinor = calculateCompoundInterest(depositMinor, 8, 12);
    expect(interestMinor).toBeGreaterThan(0);
    // Interest should be around 8299 BDT = ~829995 minor units
    expect(toMajorUnits(interestMinor)).toBeGreaterThan(8000);
  });
});
