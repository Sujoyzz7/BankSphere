import { z } from 'zod';

export const transferSchema = z.object({
  sourceAccountId: z.string().min(1, 'Source account is required'),
  destinationAccountId: z.string().min(1, 'Destination account is required'),
  amountMinorUnits: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

export const depositSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amountMinorUnits: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

export const withdrawalSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amountMinorUnits: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
