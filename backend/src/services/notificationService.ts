import { Notification, INotification } from '../models/Notification';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

export interface CreateNotificationParams {
  userId: Types.ObjectId;
  type: INotification['type'];
  title: string;
  message: string;
  channel?: INotification['channel'];
  data?: Record<string, unknown>;
}

/**
 * Create a notification.
 */
export async function createNotification(params: CreateNotificationParams): Promise<INotification> {
  try {
    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      channel: params.channel || 'IN_APP',
      data: params.data,
    });
    return notification;
  } catch (error) {
    logger.error({ err: error, userId: params.userId }, 'Failed to create notification');
    throw error;
  }
}

/**
 * Get notifications for a user.
 */
export async function getNotifications(
  userId: Types.ObjectId,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
): Promise<{ data: INotification[]; total: number; unreadCount: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, unreadOnly = false } = options;

  const query: Record<string, unknown> = { userId };
  if (unreadOnly) {
    query.read = false;
  }

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, read: false });
  const data = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: data as unknown as INotification[],
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Mark notifications as read.
 */
export async function markAsRead(
  userId: Types.ObjectId,
  notificationIds?: Types.ObjectId[]
): Promise<void> {
  const query: Record<string, unknown> = { userId };
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  await Notification.updateMany(query, { read: true });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: Types.ObjectId): Promise<void> {
  await Notification.updateMany({ userId, read: false }, { read: true });
}
