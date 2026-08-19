import mongoose, { Types } from 'mongoose';
import { Account, IAccount } from '../models/Account';
import { LedgerEntry } from '../models/LedgerEntry';
import { generateAccountNumber } from '../utils/helpers';
import { AccountNotFoundError, AccountFrozenError, AccountClosedError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Create a new account.
 */
export async function createAccount(params: {
  customerId: Types.ObjectId;
  accountType: IAccount['accountType'];
  currency?: string;
  branchId: Types.ObjectId;
  interestRate?: number;
}): Promise<IAccount> {
  const accountNumber = generateAccountNumber();
  const account = await Account.create({
    accountNumber,
    customerId: params.customerId,
    accountType: params.accountType,
    currency: params.currency || 'BDT',
    balanceMinorUnits: 0,
    availableBalanceMinorUnits: 0,
    blockedAmountMinorUnits: 0,
    interestRate: params.interestRate || 0,
    status: 'ACTIVE',
    branchId: params.branchId,
    openedAt: new Date(),
  });
  return account;
}

/**
 * Get an account by ID.
 */
export async function getAccountById(accountId: Types.ObjectId): Promise<IAccount> {
  const account = await Account.findById(accountId);
  if (!account) {
    throw new AccountNotFoundError();
  }
  return account;
}

/**
 * Get an account by account number.
 */
export async function getAccountByNumber(accountNumber: string): Promise<IAccount> {
  const account = await Account.findOne({ accountNumber });
  if (!account) {
    throw new AccountNotFoundError();
  }
  return account;
}

/**
 * Get all accounts for a customer.
 */
export async function getCustomerAccounts(customerId: Types.ObjectId): Promise<IAccount[]> {
  return Account.find({ customerId, status: { $ne: 'CLOSED' } }).sort({ createdAt: -1 });
}

/**
 * Validate that an account is active and has sufficient balance.
 */
export async function validateAccountForTransaction(
  accountId: Types.ObjectId,
  amountMinorUnits: number
): Promise<IAccount> {
  const account = await getAccountById(accountId);

  if (account.status === 'FROZEN') {
    throw new AccountFrozenError();
  }

  if (account.status === 'CLOSED') {
    throw new AccountClosedError();
  }

  if (account.status === 'SUSPENDED') {
    throw new AccountFrozenError('Account is suspended');
  }

  if (account.availableBalanceMinorUnits < amountMinorUnits) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  return account;
}

/**
 * Update account balance (must be called within a MongoDB session).
 */
export async function updateBalance(
  accountId: Types.ObjectId,
  newBalance: number,
  newAvailableBalance: number,
  session: any
): Promise<void> {
  await Account.findByIdAndUpdate(
    accountId,
    {
      balanceMinorUnits: newBalance,
      availableBalanceMinorUnits: newAvailableBalance,
    },
    { session }
  );
}

/**
 * Get account balance history.
 */
export async function getAccountBalanceHistory(
  accountId: Types.ObjectId,
  options: { page?: number; limit?: number } = {}
): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 50 } = options;

  const total = await LedgerEntry.countDocuments({ accountId });
  const data = await LedgerEntry.find({ accountId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
