import mongoose, { Types } from 'mongoose';
import { FixedDeposit, IFixedDeposit } from '../models/FixedDeposit';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { LedgerEntry } from '../models/LedgerEntry';
import { AuditLog } from '../models/AuditLog';
import { createNotification } from './notificationService';
import { generateTransactionNumber } from '../utils/helpers';
import { calculateCompoundInterest } from '../utils/money';
import { AccountNotFoundError, InsufficientBalanceError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateFDParams {
  customerId: Types.ObjectId;
  accountId: Types.ObjectId;
  amountMinorUnits: number;
  tenureMonths: number;
  interestRate: number;
}

/**
 * Create a fixed deposit.
 */
export async function createFixedDeposit(params: CreateFDParams): Promise<IFixedDeposit> {
  const session = await mongoose.startSession();

  try {
    let fd: IFixedDeposit | null = null;

    await session.withTransaction(async () => {
      // 1. Load account
      const account = await Account.findOne({ _id: params.accountId }).session(session).lean();

      if (!account) throw new AccountNotFoundError();
      if (account.availableBalanceMinorUnits < params.amountMinorUnits) {
        throw new InsufficientBalanceError();
      }

      // 2. Calculate maturity amount
      const interest = calculateCompoundInterest(params.amountMinorUnits, params.interestRate, params.tenureMonths);
      const maturityAmount = params.amountMinorUnits + interest;

      // 3. Create FD
      const startDate = new Date();
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + params.tenureMonths);

      const fixedDeposit = await FixedDeposit.create(
        [
          {
            customerId: params.customerId,
            accountId: params.accountId,
            depositAmountMinorUnits: params.amountMinorUnits,
            interestRate: params.interestRate,
            tenureMonths: params.tenureMonths,
            startDate,
            maturityDate,
            maturityAmountMinorUnits: maturityAmount,
            status: 'ACTIVE',
          },
        ],
        { session }
      );

      // 4. Debit account
      const newBalance = account.balanceMinorUnits - params.amountMinorUnits;

      const transaction = await Transaction.create(
        [
          {
            transactionNumber: generateTransactionNumber(),
            type: 'PAYMENT',
            sourceAccountId: params.accountId,
            amountMinorUnits: params.amountMinorUnits,
            feeMinorUnits: 0,
            currency: account.currency,
            description: `Fixed Deposit - ${params.tenureMonths} months`,
            status: 'COMPLETED',
            completedAt: new Date(),
            initiatedBy: params.customerId,
            idempotencyKey: new Types.ObjectId().toString(),
          },
        ],
        { session }
      );

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: params.accountId,
            entryType: 'DEBIT',
            debitMinorUnits: params.amountMinorUnits,
            creditMinorUnits: 0,
            balanceBeforeMinorUnits: account.balanceMinorUnits,
            balanceAfterMinorUnits: newBalance,
            currency: account.currency,
            description: `Fixed Deposit - ${params.tenureMonths} months`,
          },
        ],
        { session }
      );

      await Account.findByIdAndUpdate(
        params.accountId,
        {
          balanceMinorUnits: newBalance,
          availableBalanceMinorUnits: newBalance,
        },
        { session }
      );

      fd = fixedDeposit[0];
    });

    if (!fd) {
      throw new Error('Failed to create fixed deposit');
    }

    // Send notification
    try {
      const fixedDepositId = (fd as any)._id;
      await createNotification({
        userId: params.customerId,
        type: 'FD',
        title: 'Fixed Deposit Created',
        message: `Your fixed deposit of ${params.amountMinorUnits / 100} BDT for ${params.tenureMonths} months has been created`,
        data: { fixedDepositId },
      });
    } catch (notifError) {
      logger.error({ err: notifError }, 'Failed to send FD notification');
    }

    return fd;
  } catch (error) {
    logger.error({ err: error }, 'Failed to create fixed deposit');
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Get fixed deposits for a customer.
 */
export async function getCustomerFixedDeposits(customerId: Types.ObjectId): Promise<IFixedDeposit[]> {
  return FixedDeposit.find({ customerId }).sort({ createdAt: -1 });
}

/**
 * Mature a fixed deposit.
 */
export async function matureFixedDeposit(fixedDepositId: Types.ObjectId): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const fd = await FixedDeposit.findOne({ _id: fixedDepositId, status: 'ACTIVE' }).session(session);
      if (!fd) throw new Error('Fixed deposit not found or not active');

      const account = await Account.findOne({ _id: fd.accountId }).session(session).lean();
      if (!account) throw new AccountNotFoundError();

      // Credit the maturity amount
      const newBalance = account.balanceMinorUnits + fd.maturityAmountMinorUnits;

      const transaction = await Transaction.create(
        [
          {
            transactionNumber: generateTransactionNumber(),
            type: 'INTEREST',
            destinationAccountId: fd.accountId,
            amountMinorUnits: fd.maturityAmountMinorUnits,
            feeMinorUnits: 0,
            currency: account.currency,
            description: `FD Maturity - ${fd.tenureMonths} months`,
            status: 'COMPLETED',
            completedAt: new Date(),
            initiatedBy: fd.customerId,
            idempotencyKey: new Types.ObjectId().toString(),
          },
        ],
        { session }
      );

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: fd.accountId,
            entryType: 'CREDIT',
            debitMinorUnits: 0,
            creditMinorUnits: fd.maturityAmountMinorUnits,
            balanceBeforeMinorUnits: account.balanceMinorUnits,
            balanceAfterMinorUnits: newBalance,
            currency: account.currency,
            description: `FD Maturity - ${fd.tenureMonths} months`,
          },
        ],
        { session }
      );

      await Account.findByIdAndUpdate(
        fd.accountId,
        {
          balanceMinorUnits: newBalance,
          availableBalanceMinorUnits: newBalance,
        },
        { session }
      );

      await FixedDeposit.findByIdAndUpdate(
        fixedDepositId,
        { status: 'MATURED' },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}
