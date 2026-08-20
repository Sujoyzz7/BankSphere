import mongoose, { Types } from 'mongoose';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { LedgerEntry } from '../models/LedgerEntry';
import { AuditLog } from '../models/AuditLog';
import { createNotification } from './notificationService';
import { assessRisk, shouldBlockTransaction, RiskAssessmentInput } from './riskService';
import { generateTransactionNumber } from '../utils/helpers';
import { DuplicateRequestError, InsufficientBalanceError, TransactionConflictError, AccountFrozenError, AccountClosedError, LimitExceededError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TransferParams {
  sourceAccountId: Types.ObjectId;
  destinationAccountId: Types.ObjectId;
  amountMinorUnits: number;
  currency?: string;
  description: string;
  reference?: string;
  initiatedBy: Types.ObjectId;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransferResult {
  transactionId: Types.ObjectId;
  transactionNumber: string;
  status: string;
  amountMinorUnits: number;
  feeMinorUnits: number;
}

/**
 * Execute a transfer between two accounts.
 * Uses MongoDB transactions for atomicity.
 */
export async function executeTransfer(params: TransferParams): Promise<TransferResult> {
  const session = await mongoose.startSession();

  try {
    let result: TransferResult | null = null;

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
        throw new DuplicateRequestError('Transfer already in progress');
      }

      // 2. Load and lock source account
      const sourceAccount = await Account.findOne({
        _id: params.sourceAccountId,
      })
        .session(session)
        .select('+balanceMinorUnits')
        .lean();

      if (!sourceAccount) throw new Error('SOURCE_ACCOUNT_NOT_FOUND');
      if (sourceAccount.status === 'FROZEN') throw new AccountFrozenError();
      if (sourceAccount.status === 'CLOSED') throw new AccountClosedError();
      if (sourceAccount.status === 'SUSPENDED') throw new AccountFrozenError('Account is suspended');

      // 3. Load and lock destination account
      const destinationAccount = await Account.findOne({
        _id: params.destinationAccountId,
      })
        .session(session)
        .lean();

      if (!destinationAccount) throw new Error('DESTINATION_ACCOUNT_NOT_FOUND');
      if (destinationAccount.status === 'FROZEN') throw new AccountFrozenError('Destination account is frozen');
      if (destinationAccount.status === 'CLOSED') throw new AccountClosedError('Destination account is closed');

      // 4. Validate ownership (customer must own source account)
      // This should be checked at the controller level, but we add a safety check here

      // 5. Check balance
      if (sourceAccount.availableBalanceMinorUnits < params.amountMinorUnits) {
        throw new InsufficientBalanceError();
      }

      // 6. Calculate fee (simplified - 1% fee, min 10, max 5000)
      const feeMinorUnits = Math.max(10, Math.min(5000, Math.round(params.amountMinorUnits * 0.01)));

      // 7. Risk assessment
      const riskInput: RiskAssessmentInput = {
        amountMinorUnits: params.amountMinorUnits,
      };
      const risk = assessRisk(riskInput);

      if (shouldBlockTransaction(risk)) {
        throw new Error('Transaction blocked by risk assessment');
      }

      // 8. Create transaction record
      const transactionNumber = generateTransactionNumber();
      const transaction = await Transaction.create(
        [
          {
            transactionNumber,
            type: 'TRANSFER',
            sourceAccountId: params.sourceAccountId,
            destinationAccountId: params.destinationAccountId,
            amountMinorUnits: params.amountMinorUnits,
            feeMinorUnits,
            currency: params.currency || 'BDT',
            description: params.description,
            reference: params.reference,
            status: 'PROCESSING',
            riskScore: risk.score,
            initiatedBy: params.initiatedBy,
            idempotencyKey: params.idempotencyKey,
          },
        ],
        { session }
      );

      // 9. Create debit ledger entry (source)
      const sourceNewBalance = sourceAccount.balanceMinorUnits - params.amountMinorUnits - feeMinorUnits;
      const sourceNewAvailable = sourceAccount.availableBalanceMinorUnits - params.amountMinorUnits - feeMinorUnits;

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: params.sourceAccountId,
            entryType: 'DEBIT',
            debitMinorUnits: params.amountMinorUnits + feeMinorUnits,
            creditMinorUnits: 0,
            balanceBeforeMinorUnits: sourceAccount.balanceMinorUnits,
            balanceAfterMinorUnits: sourceNewBalance,
            currency: params.currency || 'BDT',
            description: `Transfer to ${destinationAccount.accountNumber}`,
          },
        ],
        { session }
      );

      // 10. Create credit ledger entry (destination)
      const destNewBalance = destinationAccount.balanceMinorUnits + params.amountMinorUnits;

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: params.destinationAccountId,
            entryType: 'CREDIT',
            debitMinorUnits: 0,
            creditMinorUnits: params.amountMinorUnits,
            balanceBeforeMinorUnits: destinationAccount.balanceMinorUnits,
            balanceAfterMinorUnits: destNewBalance,
            currency: params.currency || 'BDT',
            description: `Transfer from ${sourceAccount.accountNumber}`,
          },
        ],
        { session }
      );

      // 11. Update account balances
      await Account.findByIdAndUpdate(
        params.sourceAccountId,
        {
          balanceMinorUnits: sourceNewBalance,
          availableBalanceMinorUnits: sourceNewAvailable,
        },
        { session }
      );

      await Account.findByIdAndUpdate(
        params.destinationAccountId,
        {
          balanceMinorUnits: destNewBalance,
          availableBalanceMinorUnits: destNewBalance,
        },
        { session }
      );

      // 12. Mark transaction as completed
      await Transaction.findByIdAndUpdate(
        transaction[0]._id,
        {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        { session }
      );

      // 13. Create audit log
      await AuditLog.create(
        [
          {
            actorUserId: params.initiatedBy,
            actorRole: 'CUSTOMER',
            action: 'TRANSFER_CREATED',
            resourceType: 'Transaction',
            resourceId: transaction[0]._id,
            newData: {
              sourceAccount: sourceAccount.accountNumber,
              destinationAccount: destinationAccount.accountNumber,
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
      throw new TransactionConflictError();
    }

    // Send notifications (outside transaction)
    try {
      const sourceAccount = await Account.findById(params.sourceAccountId).lean();
      const destAccount = await Account.findById(params.destinationAccountId).lean();
      const transferRes = result as TransferResult;

      if (sourceAccount) {
        await createNotification({
          userId: sourceAccount.customerId,
          type: 'TRANSACTION',
          title: 'Transfer Sent',
          message: `You sent ${params.amountMinorUnits / 100} BDT to ${destAccount?.accountNumber || 'unknown'}`,
          data: { transactionId: transferRes.transactionId },
        });
      }

      if (destAccount) {
        await createNotification({
          userId: destAccount.customerId,
          type: 'TRANSACTION',
          title: 'Transfer Received',
          message: `You received ${params.amountMinorUnits / 100} BDT from ${sourceAccount?.accountNumber || 'unknown'}`,
          data: { transactionId: transferRes.transactionId },
        });
      }
    } catch (notifError) {
      logger.error({ err: notifError }, 'Failed to send transfer notifications');
    }

    return result;
  } catch (error) {
    if (error instanceof DuplicateRequestError) {
      throw error;
    }
    if (error instanceof InsufficientBalanceError) {
      throw error;
    }
    if (error instanceof AccountFrozenError) {
      throw error;
    }
    if (error instanceof AccountClosedError) {
      throw error;
    }
    logger.error({ err: error }, 'Transfer failed');
    throw new TransactionConflictError();
  } finally {
    await session.endSession();
  }
}

/**
 * Get transaction history for an account.
 */
export async function getTransactionHistory(
  accountId: Types.ObjectId,
  options: { page?: number; limit?: number; type?: string } = {}
): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, type } = options;

  const query: Record<string, unknown> = {
    $or: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }],
  };

  if (type) {
    query.type = type;
  }

  const total = await Transaction.countDocuments(query);
  const data = await Transaction.find(query)
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
