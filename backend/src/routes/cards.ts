import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { getCustomerCards, blockCard, unblockCard, issueCard } from '../services/cardService';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/cards
 * Get customer's cards.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const cards = await getCustomerCards(user.customerId);
    res.json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/cards
 * Issue a new card.
 */
router.post('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const { accountId, cardType } = req.body;

    const card = await issueCard({
      customerId: user.customerId,
      accountId: new Types.ObjectId(accountId),
      cardType: cardType || 'VISA',
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/cards/:id/block
 * Block a card.
 */
router.post('/:id/block', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const card = await blockCard(new Types.ObjectId(req.params.id), user.customerId);
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/cards/:id/unblock
 * Unblock a card.
 */
router.post('/:id/unblock', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const card = await unblockCard(new Types.ObjectId(req.params.id), user.customerId);
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

export default router;
