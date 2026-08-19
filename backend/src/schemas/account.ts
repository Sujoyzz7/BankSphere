import { z } from 'zod';

export const createAccountSchema = z.object({
  accountType: z.enum(['SAVINGS', 'CURRENT', 'FIXED_DEPOSIT']),
  currency: z.string().default('BDT'),
  branchId: z.string().min(1, 'Branch is required'),
  interestRate: z.number().min(0).max(100).optional(),
});

export const accountQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  accountType: z.string().optional(),
});
