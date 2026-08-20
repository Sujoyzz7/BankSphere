import { LedgerEntry, ILedgerEntry } from '../models/LedgerEntry';
import { Types } from 'mongoose';

export interface CreateLedgerEntryParams {
  transactionId: Types.ObjectId;
  accountId: Types.ObjectId;
  entryType: 'DEBIT' | 'CREDIT';
  debitMinorUnits: number;
  creditMinorUnits: number;
  balanceBeforeMinorUnits: number;
  balanceAfterMinorUnits: number;
  currency: string;
  description: string;
}

/**
 * Create a ledger entry (must be called within a MongoDB session).
 */
export async function createLedgerEntry(
  params: CreateLedgerEntryParams,
  session?: any
): Promise<ILedgerEntry> {
  const entry = new LedgerEntry(params);
  if (session) {
    await entry.save({ session });
  } else {
    await entry.save();
  }
  return entry;
}

/**
 * Get ledger entries for an account.
 */
export async function getLedgerEntries(
  accountId: Types.ObjectId,
  options: { page?: number; limit?: number; startDate?: Date; endDate?: Date } = {}
): Promise<{ data: ILedgerEntry[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 50, startDate, endDate } = options;

  const query: Record<string, unknown> = { accountId };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) (query.createdAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.createdAt as Record<string, Date>).$lte = endDate;
  }

  const total = await LedgerEntry.countDocuments(query);
  const data = await LedgerEntry.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: data as unknown as ILedgerEntry[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get ledger entries for a transaction.
 */
export async function getLedgerEntriesByTransaction(
  transactionId: Types.ObjectId
): Promise<ILedgerEntry[]> {
  const entries = await LedgerEntry.find({ transactionId }).sort({ createdAt: 1 }).lean();
  return entries as unknown as ILedgerEntry[];
}

/**
 * Verify ledger balance for a transaction.
 * Total debits must equal total credits.
 */
export async function verifyLedgerBalance(
  transactionId: Types.ObjectId
): Promise<{ balanced: boolean; totalDebit: number; totalCredit: number }> {
  const entries = await LedgerEntry.find({ transactionId });

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    totalDebit += entry.debitMinorUnits;
    totalCredit += entry.creditMinorUnits;
  }

  return {
    balanced: totalDebit === totalCredit,
    totalDebit,
    totalCredit,
  };
}
