import mongoose, { Schema, Document } from 'mongoose';

export interface IBeneficiary extends Document {
  customerId: mongoose.Types.ObjectId;
  name: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  nickname?: string;
  status: 'PENDING' | 'VERIFIED' | 'BLOCKED';
  verifiedAt?: Date;
  cooldownUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const beneficiarySchema = new Schema<IBeneficiary>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    name: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    routingNumber: { type: String, trim: true },
    nickname: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'BLOCKED'],
      default: 'PENDING',
    },
    verifiedAt: { type: Date },
    cooldownUntil: { type: Date },
  },
  {
    timestamps: true,
  }
);

beneficiarySchema.index({ customerId: 1, status: 1 });

export const Beneficiary = mongoose.model<IBeneficiary>('Beneficiary', beneficiarySchema);
export default Beneficiary;
