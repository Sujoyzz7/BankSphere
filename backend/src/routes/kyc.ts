import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { getOrCreateKycRecord, submitKycDocuments } from '../services/kycService';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/kyc
 * Get KYC status.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const record = await getOrCreateKycRecord(user.customerId);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/kyc/submit
 * Submit KYC documents.
 */
router.post('/submit', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const { documents } = req.body;

    const record = await submitKycDocuments({
      customerId: user.customerId,
      documents,
    });

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

export default router;
