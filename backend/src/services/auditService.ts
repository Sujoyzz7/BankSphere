import { AuditLog, IAuditLog } from '../models/AuditLog';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

export interface CreateAuditLogParams {
  actorUserId: Types.ObjectId;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: Types.ObjectId;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an immutable audit log record.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<IAuditLog> {
  try {
    const auditLog = await AuditLog.create({
      ...params,
      timestamp: new Date(),
    });
    return auditLog;
  } catch (error) {
    logger.error({ err: error, action: params.action }, 'Failed to create audit log');
    throw error;
  }
}

/**
 * Get audit logs with filters.
 */
export async function getAuditLogs(filters: {
  actorUserId?: Types.ObjectId;
  action?: string;
  resourceType?: string;
  resourceId?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{ data: IAuditLog[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, ...queryFilters } = filters;

  const query: Record<string, unknown> = {};

  if (queryFilters.actorUserId) query.actorUserId = queryFilters.actorUserId;
  if (queryFilters.action) query.action = queryFilters.action;
  if (queryFilters.resourceType) query.resourceType = queryFilters.resourceType;
  if (queryFilters.resourceId) query.resourceId = queryFilters.resourceId;
  if (queryFilters.startDate || queryFilters.endDate) {
    query.timestamp = {};
    if (queryFilters.startDate) (query.timestamp as Record<string, Date>).$gte = queryFilters.startDate;
    if (queryFilters.endDate) (query.timestamp as Record<string, Date>).$lte = queryFilters.endDate;
  }

  const total = await AuditLog.countDocuments(query);
  const data = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: data as unknown as IAuditLog[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
