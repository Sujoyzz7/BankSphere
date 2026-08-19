import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalRequest extends Document {
  requestType: string;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requestData: Record<string, unknown>;
  rejectionReason?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalRequestSchema = new Schema<IApprovalRequest>(
  {
    requestType: { type: String, required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    requestData: { type: Schema.Types.Mixed, required: true },
    rejectionReason: { type: String },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

approvalRequestSchema.index({ requestedBy: 1 });
approvalRequestSchema.index({ status: 1, expiresAt: 1 });

export const ApprovalRequest = mongoose.model<IApprovalRequest>('ApprovalRequest', approvalRequestSchema);
export default ApprovalRequest;
