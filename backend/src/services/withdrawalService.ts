import mongoose, { Types } from 'mongoose';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { LedgerEntry } from '../models/LedgerEntry';
import { AuditLog } from '../models/AuditLog';
import { createNotification } from './notificationService';
import { generateTransactionNumber } from '../utils/helpers';
import { AccountNotFoundError, AccountFrozenError, AccountClosedError, InsufficientBalanceError, LimitExceededError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface WithdrawalParams {
  accountId: Types.ObjectId;
  amountMinorUnits: number;
  currency?: string;
  description: string;
  reference?: string;
  initiatedBy: Types.ObjectId;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Execute a withdrawal.
 */
export async function executeWithdrawal(params: WithdrawalParams): Promise<{
  transactionId: Types.ObjectId;
  transactionNumber: string;
  status: string;
  amountMinorUnits: number;
  feeMinorUnits: number;
}> {
  const session = await mongoose.startSession();

  try {
    let result: any = null;

    await session.withTransaction(async () => {
      // 1. Check idempotency
      const existingTransaction = await Transaction.findOne({
        idempotencyKey: params.idempotencyKey,
      }).session(session);

      if (existingTransaction) {
        if (existingTransaction.status === 'COMPLETED') {
          result = {
            transactionId: existingTransaction._id,
            transactionNumber: existingTransaction.transactionNumber,
            status: existingTransaction.status,
            amountMinorUnits: existingTransaction.amountMinorUnits,
            feeMinorUnits: existingTransaction.feeMinorUnits,
          };
          return;
        }
        throw new Error('DUPLICATE_REQUEST');
      }

      // 2. Load account
      const account = await Account.findOne({ _id: params.accountId }).session(session).lean();

      if (!account) throw new AccountNotFoundError();
      if (account.status === 'FROZEN') throw new AccountFrozenError();
      if (account.status === 'CLOSED') throw new AccountClosedError();

      // 3. Calculate fee (1% fee, min 10, max 5000)
      const feeMinorUnits = Math.max(10, Math.min(5000, Math.round(params.amountMinorUnits * 0.01)));
      const totalDebit = params.amountMinorUnits + feeMinorUnits;

      // 4. Check balance
      if (account.availableBalanceMinorUnits < totalDebit) {
        throw new InsufficientBalanceError();
      }

      // 5. Daily limit check (simplified - 500,000 BDT daily limit)
      const dailyLimit = 50000000; // 500,000 BDT in minor units
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayWithdrawals = await Transaction.aggregate([
        {
          $match: {
            sourceAccountId: params.accountId,
            type: 'WITHDRAWAL',
            status: 'COMPLETED',
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amountMinorUnits' },
          },
        },
      ]).session(session);

      const dailyTotal = todayWithdrawals[0]?.total || 0;
      if (dailyTotal + params.amountMinorUnits > dailyLimit) {
        throw new LimitExceededError('Daily withdrawal limit exceeded');
      }

      // 6. Create transaction
      const transactionNumber = generateTransactionNumber();
      const transaction = await Transaction.create(
        [
          {
            transactionNumber,
            type: 'WITHDRAWAL',
            sourceAccountId: params.accountId,
            amountMinorUnits: params.amountMinorUnits,
            feeMinorUnits,
            currency: params.currency || 'BDT',
            description: params.description,
            reference: params.reference,
            status: 'PROCESSING',
            riskScore: 0,
            initiatedBy: params.initiatedBy,
            idempotencyKey: params.idempotencyKey,
          },
        ],
        { session }
      );

      // 7. Create debit ledger entry
      const newBalance = account.balanceMinorUnits - totalDebit;

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: params.accountId,
            entryType: 'DEBIT',
            debitMinorUnits: totalDebit,
            creditMinorUnits: 0,
            balanceBeforeMinorUnits: account.balanceMinorUnits,
            balanceAfterMinorUnits: newBalance,
            currency: params.currency || 'BDT',
            description: params.description,
          },
        ],
        { session }
      );

      // 8. Update account balance
      await Account.findByIdAndUpdate(
        params.accountId,
        {
          balanceMinorUnits: newBalance,
          availableBalanceMinorUnits: newBalance,
        },
        { session }
      );

      // 9. Mark transaction as completed
      await Transaction.findByIdAndUpdate(
        transaction[0]._id,
        {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        { session }
      );

      // 10. Create audit log
      await AuditLog.create(
        [
          {
            actorUserId: params.initiatedBy,
            actorRole: 'CUSTOMER',
            action: 'WITHDRAWAL_CREATED',
            resourceType: 'Transaction',
            resourceId: transaction[0]._id,
            newData: {
              account: account.accountNumber,
              amount: params.amountMinorUnits,
              fee: feeMinorUnits,
            },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            timestamp: new Date(),
          },
        ],
        { session }
      );

      result = {
        transactionId: transaction[0]._id,
        transactionNumber,
        status: 'COMPLETED',
        amountMinorUnits: params.amountMinorUnits,
        feeMinorUnits,
      };
    });

    if (!result) {
      throw new Error('Withdrawal failed');
    }

    // Send notification
    try {
      const account = await Account.findById(params.accountId).lean();
      if (account) {
        await createNotification({
          userId: account.customerId,
          type: 'TRANSACTION',
          title: 'Withdrawal Processed',
          message: `You withdrew ${params.amountMinorUnits / 100} BDT from account ${account.accountNumber}`,
          data: { transactionId: result.transactionId },
        });
      }
    } catch (notifError) {
      logger.error({ err: notifError }, 'Failed to send withdrawal notification');
    }

    return result;
  } catch (error) {
    logger.error({ err: error }, 'Withdrawal failed');
    throw error;
  } finally {
    await session.endSession();
  }
}
