import { Router, Request, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { transferSchema } from '../schemas/transaction';
import { executeTransfer } from '../services/transferService';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

const router = Router();

/**
 * POST /api/v1/transfers
 * Create a transfer.
 */
router.post(
  '/',
  authenticateFirebaseUser,
  validateRequest(transferSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { sourceAccountId, destinationAccountId, amountMinorUnits, description, reference, idempotencyKey } = req.body;

      const result = await executeTransfer({
        sourceAccountId: new Types.ObjectId(sourceAccountId),
        destinationAccountId: new Types.ObjectId(destinationAccountId),
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
      logger.error({ err: error }, 'Transfer failed');
      next(error);
    }
  }
);

export default router;
