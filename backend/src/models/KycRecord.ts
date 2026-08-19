import mongoose, { Schema, Document } from 'mongoose';

export interface IKycRecord extends Document {
  customerId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'DOCUMENT_SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  documents: mongoose.Types.ObjectId[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const kycRecordSchema = new Schema<IKycRecord>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'DOCUMENT_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'],
      default: 'PENDING',
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    rejectionReason: { type: String },
    documents: [{ type: Schema.Types.ObjectId, ref: 'KycDocument' }],
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

kycRecordSchema.index({ customerId: 1 });
kycRecordSchema.index({ status: 1 });

export const KycRecord = mongoose.model<IKycRecord>('KycRecord', kycRecordSchema);
export default KycRecord;
