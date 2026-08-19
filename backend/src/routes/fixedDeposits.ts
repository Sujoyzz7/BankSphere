import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { createFixedDeposit, getCustomerFixedDeposits } from '../services/fixedDepositService';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/fixed-deposits
 * Get customer's fixed deposits.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const fds = await getCustomerFixedDeposits(user.customerId);
    res.json({ success: true, data: fds });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/fixed-deposits
 * Create a fixed deposit.
 */
router.post('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const { accountId, amountMinorUnits, tenureMonths, interestRate } = req.body;

    const fd = await createFixedDeposit({
      customerId: user.customerId,
      accountId: new Types.ObjectId(accountId),
      amountMinorUnits,
      tenureMonths,
      interestRate,
    });

    res.status(201).json({ success: true, data: fd });
  } catch (error) {
    next(error);
  }
});

export default router;
