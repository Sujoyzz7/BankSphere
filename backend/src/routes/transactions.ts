import { Router, Request, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { LedgerEntry } from '../models/LedgerEntry';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/transactions
 * Get transaction history.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId, type, status, page = 1, limit = 20, startDate, endDate } = req.query;

    const query: Record<string, unknown> = {};

    if (accountId) {
      query.$or = [
        { sourceAccountId: new Types.ObjectId(accountId as string) },
        { destinationAccountId: new Types.ObjectId(accountId as string) },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const total = await Transaction.countDocuments(query);
    const data = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/transactions/:id
 * Get transaction details.
 */
router.get('/:id', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();
    if (!transaction) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
      return;
    }

    // Get ledger entries for this transaction
    const ledgerEntries = await LedgerEntry.find({ transactionId: transaction._id }).lean();

    res.json({ success: true, data: { ...transaction, ledgerEntries } });
  } catch (error) {
    next(error);
  }
});

export default router;
