import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { applyLoanSchema, loanRepaymentSchema } from '../schemas/loan';
import { applyLoan, getCustomerLoans, getLoanSchedule, makeRepayment } from '../services/loanService';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/loans
 * Get customer's loans.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const loans = await getCustomerLoans(user.customerId);
    res.json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/loans/:id/schedule
 * Get loan repayment schedule.
 */
router.get('/:id/schedule', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schedule = await getLoanSchedule(new Types.ObjectId(req.params.id));
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/loans
 * Apply for a loan.
 */
router.post(
  '/',
  authenticateFirebaseUser,
  validateRequest(applyLoanSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.customerId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
        return;
      }

      const { accountId, loanType, principalAmountMinorUnits, interestRate, tenureMonths } = req.body;

      const loan = await applyLoan({
        customerId: user.customerId,
        accountId: new Types.ObjectId(accountId),
        loanType,
        principalAmountMinorUnits,
        interestRate,
        tenureMonths,
      });

      res.status(201).json({ success: true, data: loan });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/loans/repayment
 * Make a loan repayment.
 */
router.post(
  '/repayment',
  authenticateFirebaseUser,
  validateRequest(loanRepaymentSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { loanId, scheduleId, amountMinorUnits } = req.body;

      await makeRepayment(
        new Types.ObjectId(loanId),
        new Types.ObjectId(scheduleId),
        amountMinorUnits,
        user._id
      );

      res.json({ success: true, message: 'Repayment successful' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
