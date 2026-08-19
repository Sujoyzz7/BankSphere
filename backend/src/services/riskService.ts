import { Types } from 'mongoose';

export interface RiskAssessmentInput {
  amountMinorUnits: number;
  transactionFrequency?: number;
  beneficiaryAge?: number;
  accountAge?: number;
  failedLoginCount?: number;
  isNewDevice?: boolean;
  transactionPattern?: string;
  ipAddress?: string;
}

export interface RiskAssessmentResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  requiresApproval: boolean;
}

/**
 * Assess the risk level of a transaction.
 * Returns a risk score and level.
 */
export function assessRisk(input: RiskAssessmentInput): RiskAssessmentResult {
  let score = 0;
  const reasons: string[] = [];

  // Amount-based risk
  const amount = input.amountMinorUnits;
  if (amount > 100000000) { // > 1,000,000 BDT
    score += 40;
    reasons.push('Very large transaction amount');
  } else if (amount > 50000000) { // > 500,000 BDT
    score += 30;
    reasons.push('Large transaction amount');
  } else if (amount > 10000000) { // > 100,000 BDT
    score += 15;
    reasons.push('Moderate transaction amount');
  }

  // Transaction frequency
  if (input.transactionFrequency && input.transactionFrequency > 10) {
    score += 25;
    reasons.push('High transaction frequency');
  } else if (input.transactionFrequency && input.transactionFrequency > 5) {
    score += 10;
    reasons.push('Moderate transaction frequency');
  }

  // Beneficiary age (new beneficiary = higher risk)
  if (input.beneficiaryAge !== undefined && input.beneficiaryAge < 1) {
    score += 20;
    reasons.push('New beneficiary (< 1 day old)');
  } else if (input.beneficiaryAge !== undefined && input.beneficiaryAge < 7) {
    score += 10;
    reasons.push('Recently added beneficiary');
  }

  // Account age
  if (input.accountAge !== undefined && input.accountAge < 30) {
    score += 15;
    reasons.push('New account (< 30 days)');
  }

  // Failed login attempts
  if (input.failedLoginCount && input.failedLoginCount > 5) {
    score += 30;
    reasons.push('Multiple failed login attempts');
  } else if (input.failedLoginCount && input.failedLoginCount > 2) {
    score += 15;
    reasons.push('Some failed login attempts');
  }

  // New device
  if (input.isNewDevice) {
    score += 10;
    reasons.push('Transaction from new device');
  }

  // Determine level
  let level: RiskAssessmentResult['level'];
  let requiresApproval = false;

  if (score >= 70) {
    level = 'CRITICAL';
    requiresApproval = true;
  } else if (score >= 40) {
    level = 'HIGH';
    requiresApproval = true;
  } else if (score >= 20) {
    level = 'MEDIUM';
    requiresApproval = false;
  } else {
    level = 'LOW';
    requiresApproval = false;
  }

  return {
    score,
    level,
    reasons,
    requiresApproval,
  };
}

/**
 * Check if a transaction should be blocked based on risk rules.
 */
export function shouldBlockTransaction(risk: RiskAssessmentResult): boolean {
  return risk.level === 'CRITICAL';
}
