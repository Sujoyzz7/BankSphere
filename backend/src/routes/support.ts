import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { createTicket, addMessage, getCustomerTickets, getTicketMessages } from '../services/supportService';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/support/tickets
 * Get customer's support tickets.
 */
router.get('/tickets', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const tickets = await getCustomerTickets(user.customerId);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/support/tickets
 * Create a support ticket.
 */
router.post('/tickets', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.customerId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Customer profile not found' } });
      return;
    }

    const { subject, category, priority, message } = req.body;

    const ticket = await createTicket({
      customerId: user.customerId,
      subject,
      category,
      priority,
      initialMessage: message,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/support/tickets/:id/messages
 * Get messages for a ticket.
 */
router.get('/tickets/:id/messages', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await getTicketMessages(new Types.ObjectId(req.params.id));
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/support/tickets/:id/messages
 * Add a message to a ticket.
 */
router.post('/tickets/:id/messages', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { message } = req.body;

    const msg = await addMessage({
      ticketId: new Types.ObjectId(req.params.id),
      senderId: user._id,
      senderType: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'EMPLOYEE',
      message,
    });

    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    next(error);
  }
});

export default router;
