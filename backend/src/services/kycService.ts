import { Types } from 'mongoose';
import { KycRecord, IKycRecord } from '../models/KycRecord';
import { KycDocument, IKycDocument } from '../models/KycDocument';
import { Customer } from '../models/Customer';
import { createNotification } from './notificationService';
import { logger } from '../utils/logger';

/**
 * Create or get KYC record for a customer.
 */
export async function getOrCreateKycRecord(customerId: Types.ObjectId): Promise<IKycRecord> {
  let record = await KycRecord.findOne({ customerId });
  if (!record) {
    record = await KycRecord.create({ customerId, status: 'PENDING' });
  }
  return record;
}

/**
 * Submit KYC documents.
 */
export async function submitKycDocuments(params: {
  customerId: Types.ObjectId;
  documents: {
    documentType: IKycDocument['documentType'];
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
}): Promise<IKycRecord> {
  const record = await getOrCreateKycRecord(params.customerId);

  // Create document records
  const docRecords = await KycDocument.insertMany(
    params.documents.map((doc) => ({
      kycRecordId: record._id,
      customerId: params.customerId,
      ...doc,
      uploadedAt: new Date(),
    }))
  );

  // Update KYC record
  const updatedRecord = await KycRecord.findByIdAndUpdate(
    record._id,
    {
      status: 'DOCUMENT_SUBMITTED',
      submittedAt: new Date(),
      $push: { documents: { $each: docRecords.map((d) => d._id) } },
    },
    { new: true }
  );

  // Update customer KYC status
  await Customer.findByIdAndUpdate(params.customerId, { kycStatus: 'DOCUMENT_SUBMITTED' });

  return updatedRecord!;
}

/**
 * Review KYC (admin action).
 */
export async function reviewKyc(params: {
  kycRecordId: Types.ObjectId;
  decision: 'APPROVED' | 'REJECTED';
  reviewedBy: Types.ObjectId;
  rejectionReason?: string;
}): Promise<IKycRecord> {
  const record = await KycRecord.findByIdAndUpdate(
    params.kycRecordId,
    {
      status: params.decision,
      reviewedAt: new Date(),
      reviewedBy: params.reviewedBy,
      rejectionReason: params.rejectionReason,
    },
    { new: true }
  );

  if (!record) throw new Error('KYC record not found');

  // Update customer KYC status
  await Customer.findByIdAndUpdate(record.customerId, {
    kycStatus: params.decision,
  });

  // Send notification
  try {
    await createNotification({
      userId: record.customerId,
      type: 'KYC',
      title: `KYC ${params.decision}`,
      message: params.decision === 'APPROVED'
        ? 'Your KYC verification has been approved'
        : `Your KYC verification has been rejected: ${params.rejectionReason || 'No reason provided'}`,
      data: { kycRecordId: record._id },
    });
  } catch (notifError) {
    logger.error({ err: notifError }, 'Failed to send KYC notification');
  }

  return record;
}

/**
 * Get KYC records (admin).
 */
export async function getKycRecords(options: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: IKycRecord[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, ...filters } = options;

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;

  const total = await KycRecord.countDocuments(query);
  const data = await KycRecord.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('customerId', 'fullName email customerNumber')
    .lean();

  return {
    data: data as unknown as IKycRecord[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
