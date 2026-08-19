import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, AuthRequest } from '../middleware/auth';
import { getNotifications, markAllAsRead, markAsRead } from '../services/notificationService';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/v1/notifications
 * Get notifications for the current user.
 */
router.get('/', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await getNotifications(user._id, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/read
 * Mark notifications as read.
 */
router.put('/read', authenticateFirebaseUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      await markAsRead(user._id, notificationIds.map((id: string) => new Types.ObjectId(id)));
    } else {
      await markAllAsRead(user._id);
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
