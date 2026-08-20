import { describe, it, expect } from 'vitest';
import { assessRisk, shouldBlockTransaction } from './riskService';

describe('Risk & Fraud Engine Service', () => {
  it('assigns LOW risk level for small transfers', () => {
    const risk = assessRisk({ amountMinorUnits: 100000 }); // 1,000 BDT
    expect(risk.level).toBe('LOW');
    expect(risk.score).toBeLessThan(20);
    expect(shouldBlockTransaction(risk)).toBe(false);
  });

  it('assigns HIGH/CRITICAL risk for extremely large transfers', () => {
    const risk = assessRisk({
      amountMinorUnits: 150000000, // 1,500,000 BDT
      transactionFrequency: 15,
      isNewDevice: true,
      failedLoginCount: 6,
    });
    expect(risk.score).toBeGreaterThanOrEqual(70);
    expect(risk.level).toBe('CRITICAL');
    expect(shouldBlockTransaction(risk)).toBe(true);
  });
});
