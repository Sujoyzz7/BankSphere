import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { Beneficiary } from '../models/Beneficiary';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/beneficiaries
 * Get customer's beneficiaries.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const beneficiaries = await Beneficiary.find({ customerId: user.customerId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: beneficiaries });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/beneficiaries
 * Add a beneficiary.
 */
router.post('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const { name, bankName, accountNumber, routingNumber, nickname } = req.body;

    const beneficiary = await Beneficiary.create({
      customerId: user.customerId,
      name,
      bankName,
      accountNumber,
      routingNumber,
      nickname,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: beneficiary });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/beneficiaries/:id
 * Remove a beneficiary.
 */
router.delete('/:id', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    await Beneficiary.findOneAndDelete({
      _id: new Types.ObjectId(req.params.id),
      customerId: user.customerId,
    });

    res.json({ success: true, message: 'Beneficiary removed' });
  } catch (error) {
    next(error);
  }
});

export default router;
