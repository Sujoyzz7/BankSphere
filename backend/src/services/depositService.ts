import mongoose, { Types } from 'mongoose';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { LedgerEntry } from '../models/LedgerEntry';
import { AuditLog } from '../models/AuditLog';
import { createNotification } from './notificationService';
import { generateTransactionNumber } from '../utils/helpers';
import { AccountNotFoundError, AccountFrozenError, AccountClosedError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface DepositParams {
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
 * Execute a simulated deposit.
 * This is for MVP/demo purposes.
 */
export async function executeDeposit(params: DepositParams): Promise<{
  transactionId: Types.ObjectId;
  transactionNumber: string;
  status: string;
  amountMinorUnits: number;
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

      // 3. Create transaction
      const transactionNumber = generateTransactionNumber();
      const transaction = await Transaction.create(
        [
          {
            transactionNumber,
            type: 'DEPOSIT',
            destinationAccountId: params.accountId,
            amountMinorUnits: params.amountMinorUnits,
            feeMinorUnits: 0,
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

      // 4. Create credit ledger entry
      const newBalance = account.balanceMinorUnits + params.amountMinorUnits;

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: params.accountId,
            entryType: 'CREDIT',
            debitMinorUnits: 0,
            creditMinorUnits: params.amountMinorUnits,
            balanceBeforeMinorUnits: account.balanceMinorUnits,
            balanceAfterMinorUnits: newBalance,
            currency: params.currency || 'BDT',
            description: params.description,
          },
        ],
        { session }
      );

      // 5. Update account balance
      await Account.findByIdAndUpdate(
        params.accountId,
        {
          balanceMinorUnits: newBalance,
          availableBalanceMinorUnits: newBalance,
        },
        { session }
      );

      // 6. Mark transaction as completed
      await Transaction.findByIdAndUpdate(
        transaction[0]._id,
        {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        { session }
      );

      // 7. Create audit log
      await AuditLog.create(
        [
          {
            actorUserId: params.initiatedBy,
            actorRole: 'CUSTOMER',
            action: 'DEPOSIT_CREATED',
            resourceType: 'Transaction',
            resourceId: transaction[0]._id,
            newData: {
              account: account.accountNumber,
              amount: params.amountMinorUnits,
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
      };
    });

    if (!result) {
      throw new Error('Deposit failed');
    }

    // Send notification
    try {
      const account = await Account.findById(params.accountId).lean();
      if (account) {
        await createNotification({
          userId: account.customerId,
          type: 'TRANSACTION',
          title: 'Deposit Received',
          message: `You deposited ${params.amountMinorUnits / 100} BDT to account ${account.accountNumber}`,
          data: { transactionId: result.transactionId },
        });
      }
    } catch (notifError) {
      logger.error({ err: notifError }, 'Failed to send deposit notification');
    }

    return result;
  } catch (error) {
    logger.error({ err: error }, 'Deposit failed');
    throw error;
  } finally {
    await session.endSession();
  }
}
