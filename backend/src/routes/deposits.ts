import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { depositSchema } from '../schemas/transaction';
import { executeDeposit } from '../services/depositService';
import { Types } from 'mongoose';

const router = Router();

/**
 * POST /api/v1/deposits
 * Create a deposit.
 */
router.post(
  '/',
  authenticateFirebaseUser,
  validateRequest(depositSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { accountId, amountMinorUnits, description, reference, idempotencyKey } = req.body;

      const result = await executeDeposit({
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
