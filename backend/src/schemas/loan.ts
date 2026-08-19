import { z } from 'zod';

export const applyLoanSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  loanType: z.enum(['PERSONAL', 'HOME', 'EDUCATION', 'BUSINESS', 'EMERGENCY']),
  principalAmountMinorUnits: z.number().int().positive('Amount must be positive'),
  interestRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().positive().max(360),
});

export const loanRepaymentSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  amountMinorUnits: z.number().int().positive('Amount must be positive'),
});

export const approveLoanSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});
