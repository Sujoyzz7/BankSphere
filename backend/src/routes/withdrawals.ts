import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { withdrawalSchema } from '../schemas/transaction';
import { executeWithdrawal } from '../services/withdrawalService';
import { Types } from 'mongoose';

const router = Router();

/**
 * POST /api/v1/withdrawals
 * Create a withdrawal.
 */
router.post(
  '/',
  authenticateFirebaseUser,
  validateRequest(withdrawalSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { accountId, amountMinorUnits, description, reference, idempotencyKey } = req.body;

      const result = await executeWithdrawal({
        accountId: new Types.ObjectId(accountId),
        amountMinorUnits,
        description,
        reference,
        initiatedBy: user._id,
        idempotencyKey,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.errorCode) {
        res.status(error.statusCode || 400).json({
          success: false,
          error: { code: error.errorCode, message: error.message },
        });
        return;
      }
      next(error);
    }
  }
);

export default router;
