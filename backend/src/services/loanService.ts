import mongoose, { Types } from 'mongoose';
import { Loan, ILoan } from '../models/Loan';
import { LoanSchedule, ILoanSchedule } from '../models/LoanSchedule';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { LedgerEntry } from '../models/LedgerEntry';
import { AuditLog } from '../models/AuditLog';
import { createNotification } from './notificationService';
import { generateTransactionNumber } from '../utils/helpers';
import { calculateEMI } from '../utils/money';
import { logger } from '../utils/logger';

export interface ApplyLoanParams {
  customerId: Types.ObjectId;
  accountId: Types.ObjectId;
  loanType: ILoan['loanType'];
  principalAmountMinorUnits: number;
  interestRate: number;
  tenureMonths: number;
}

/**
 * Apply for a loan.
 */
export async function applyLoan(params: ApplyLoanParams): Promise<ILoan> {
  const emiAmount = calculateEMI(params.principalAmountMinorUnits, params.interestRate, params.tenureMonths);
  const totalPayable = emiAmount * params.tenureMonths;

  const loan = await Loan.create({
    customerId: params.customerId,
    accountId: params.accountId,
    loanType: params.loanType,
    principalAmountMinorUnits: params.principalAmountMinorUnits,
    interestRate: params.interestRate,
    tenureMonths: params.tenureMonths,
    emiAmountMinorUnits: emiAmount,
    totalPayableMinorUnits: totalPayable,
    remainingAmountMinorUnits: totalPayable,
    status: 'APPLIED',
    appliedAt: new Date(),
  });

  return loan;
}

/**
 * Approve a loan and disburse funds.
 */
export async function approveAndDisburse(
  loanId: Types.ObjectId,
  approvedBy: Types.ObjectId
): Promise<ILoan> {
  const session = await mongoose.startSession();

  try {
    let loan: ILoan | null = null;

    await session.withTransaction(async () => {
      const existingLoan = await Loan.findOne({ _id: loanId, status: 'APPLIED' }).session(session);
      if (!existingLoan) throw new Error('Loan not found or not in applied status');

      // Update loan status
      loan = await Loan.findByIdAndUpdate(
        loanId,
        {
          status: 'DISBURSED',
          approvedBy,
          approvedAt: new Date(),
          disbursedAt: new Date(),
        },
        { session, new: true }
      );

      if (!loan) throw new Error('Failed to update loan');

      // Create repayment schedule
      const schedule: any[] = [];
      for (let i = 1; i <= loan.tenureMonths; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        schedule.push({
          loanId: loan._id,
          installmentNumber: i,
          dueDate,
          principalMinorUnits: Math.round(loan.principalAmountMinorUnits / loan.tenureMonths),
          interestMinorUnits: Math.round((loan.totalPayableMinorUnits - loan.principalAmountMinorUnits) / loan.tenureMonths),
          totalMinorUnits: loan.emiAmountMinorUnits,
          status: 'PENDING',
        });
      }

      await LoanSchedule.insertMany(schedule, { session });

      // Disburse funds to account
      const account = await Account.findOne({ _id: loan.accountId }).session(session).lean();
      if (!account) throw new Error('Account not found');

      const newBalance = account.balanceMinorUnits + loan.principalAmountMinorUnits;

      const transaction = await Transaction.create(
        [
          {
            transactionNumber: generateTransactionNumber(),
            type: 'LOAN_DISBURSEMENT',
            destinationAccountId: loan.accountId,
            amountMinorUnits: loan.principalAmountMinorUnits,
            feeMinorUnits: 0,
            currency: account.currency,
            description: `Loan Disbursement - ${loan.loanType}`,
            status: 'COMPLETED',
            completedAt: new Date(),
            initiatedBy: approvedBy,
            idempotencyKey: new Types.ObjectId().toString(),
          },
        ],
        { session }
      );

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: loan.accountId,
            entryType: 'CREDIT',
            debitMinorUnits: 0,
            creditMinorUnits: loan.principalAmountMinorUnits,
            balanceBeforeMinorUnits: account.balanceMinorUnits,
            balanceAfterMinorUnits: newBalance,
            currency: account.currency,
            description: `Loan Disbursement - ${loan.loanType}`,
          },
        ],
        { session }
      );

      await Account.findByIdAndUpdate(
        loan.accountId,
        {
          balanceMinorUnits: newBalance,
          availableBalanceMinorUnits: newBalance,
        },
        { session }
      );
    });

    if (!loan) throw new Error('Loan approval failed');

    // Send notification
    try {
      await createNotification({
        userId: loan.customerId,
        type: 'LOAN',
        title: 'Loan Approved & Disbursed',
        message: `Your ${loan.loanType} loan of ${loan.principalAmountMinorUnits / 100} BDT has been disbursed`,
        data: { loanId: loan._id },
      });
    } catch (notifError) {
      logger.error({ err: notifError }, 'Failed to send loan notification');
    }

    return loan;
  } finally {
    await session.endSession();
  }
}

/**
 * Get loans for a customer.
 */
export async function getCustomerLoans(customerId: Types.ObjectId): Promise<ILoan[]> {
  return Loan.find({ customerId }).sort({ createdAt: -1 });
}

/**
 * Get loan schedule.
 */
export async function getLoanSchedule(loanId: Types.ObjectId): Promise<ILoanSchedule[]> {
  return LoanSchedule.find({ loanId }).sort({ installmentNumber: 1 });
}

/**
 * Make a loan repayment.
 */
export async function makeRepayment(
  loanId: Types.ObjectId,
  scheduleId: Types.ObjectId,
  amountMinorUnits: number,
  initiatedBy: Types.ObjectId
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const loan = await Loan.findOne({ _id: loanId, status: 'DISBURSED' }).session(session);
      if (!loan) throw new Error('Loan not found or not disbursed');

      const schedule = await LoanSchedule.findOne({ _id: scheduleId, loanId, status: { $ne: 'PAID' } }).session(session);
      if (!schedule) throw new Error('Installment not found or already paid');

      const account = await Account.findOne({ _id: loan.accountId }).session(session).lean();
      if (!account) throw new Error('Account not found');

      if (account.availableBalanceMinorUnits < amountMinorUnits) {
        throw new Error('Insufficient balance');
      }

      // Debit account
      const newBalance = account.balanceMinorUnits - amountMinorUnits;

      const transaction = await Transaction.create(
        [
          {
            transactionNumber: generateTransactionNumber(),
            type: 'LOAN_REPAYMENT',
            sourceAccountId: loan.accountId,
            amountMinorUnits,
            feeMinorUnits: 0,
            currency: account.currency,
            description: `Loan Repayment - Installment #${schedule.installmentNumber}`,
            status: 'COMPLETED',
            completedAt: new Date(),
            initiatedBy,
            idempotencyKey: new Types.ObjectId().toString(),
          },
        ],
        { session }
      );

      await LedgerEntry.create(
        [
          {
            transactionId: transaction[0]._id,
            accountId: loan.accountId,
            entryType: 'DEBIT',
            debitMinorUnits: amountMinorUnits,
            creditMinorUnits: 0,
            balanceBeforeMinorUnits: account.balanceMinorUnits,
            balanceAfterMinorUnits: newBalance,
            currency: account.currency,
            description: `Loan Repayment - Installment #${schedule.installmentNumber}`,
          },
        ],
        { session }
      );

      await Account.findByIdAndUpdate(
        loan.accountId,
        {
          balanceMinorUnits: newBalance,
          availableBalanceMinorUnits: newBalance,
        },
        { session }
      );

      // Update schedule
      await LoanSchedule.findByIdAndUpdate(
        scheduleId,
        {
          paidAmountMinorUnits: amountMinorUnits,
          paidDate: new Date(),
          transactionId: transaction[0]._id,
          status: amountMinorUnits >= schedule.totalMinorUnits ? 'PAID' : 'PARTIAL',
        },
        { session }
      );

      // Update loan
      const newPaidAmount = loan.paidAmountMinorUnits + amountMinorUnits;
      const newRemaining = loan.totalPayableMinorUnits - newPaidAmount;

      await Loan.findByIdAndUpdate(
        loanId,
        {
          paidAmountMinorUnits: newPaidAmount,
          remainingAmountMinorUnits: newRemaining,
          status: newRemaining <= 0 ? 'CLOSED' : 'REPAYMENT',
          ...(newRemaining <= 0 ? { closedAt: new Date() } : {}),
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}
