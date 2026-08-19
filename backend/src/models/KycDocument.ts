import mongoose, { Schema, Document } from 'mongoose';

export interface IKycDocument extends Document {
  kycRecordId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  documentType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'UTILITY_BILL' | 'BANK_STATEMENT' | 'OTHER';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const kycDocumentSchema = new Schema<IKycDocument>(
  {
    kycRecordId: { type: Schema.Types.ObjectId, ref: 'KycRecord', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    documentType: {
      type: String,
      enum: ['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'UTILITY_BILL', 'BANK_STATEMENT', 'OTHER'],
      required: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

kycDocumentSchema.index({ customerId: 1 });
kycDocumentSchema.index({ kycRecordId: 1 });

export const KycDocument = mongoose.model<IKycDocument>('KycDocument', kycDocumentSchema);
export default KycDocument;
