import { Router, Request, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, requireRole, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createAccountSchema } from '../schemas/account';
import { Account } from '../models/Account';
import { Customer } from '../models/Customer';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/accounts
 * Get customer's accounts.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    let customerId: Types.ObjectId;
    if (user.role === 'CUSTOMER') {
      if (!user.customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
        return;
      }
      customerId = user.customerId;
    } else {
      // Admin/staff can query by customerId
      customerId = new Types.ObjectId(req.query.customerId as string);
    }

    const accounts = await Account.find({ customerId, status: { $ne: 'CLOSED' } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/accounts/:id
 * Get account details.
 */
router.get('/:id', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const account = await Account.findById(req.params.id).lean();
    if (!account) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }

    // Check ownership for customers
    if (req.user!.role === 'CUSTOMER' && req.user!.customerId?.toString() !== account.customerId.toString()) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/accounts
 * Create a new account.
 */
router.post(
  '/',
  authenticateFirebaseUser,
  validateRequest(createAccountSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { accountType, currency, branchId, interestRate } = req.body;

      let customerId: Types.ObjectId;
      if (user.role === 'CUSTOMER') {
        if (!user.customerId) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
          return;
        }
        customerId = user.customerId;
      } else {
        customerId = new Types.ObjectId(req.body.customerId);
      }

      const accountNumber = `ACC-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const account = await Account.create({
        accountNumber,
        customerId,
        accountType,
        currency: currency || 'BDT',
        balanceMinorUnits: 0,
        availableBalanceMinorUnits: 0,
        blockedAmountMinorUnits: 0,
        interestRate: interestRate || 0,
        status: 'ACTIVE',
        branchId: new Types.ObjectId(branchId),
        openedAt: new Date(),
      });

      res.status(201).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
