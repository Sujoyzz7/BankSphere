import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  firebaseUid: string;
  customerNumber: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  profileImageUrl?: string;
  kycStatus: 'PENDING' | 'DOCUMENT_SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED';
  branchId?: mongoose.Types.ObjectId;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'SUSPENDED';
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    customerNumber: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Bangladesh' },
    },
    profileImageUrl: { type: String },
    kycStatus: {
      type: String,
      enum: ['PENDING', 'DOCUMENT_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'],
      default: 'PENDING',
    },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'FROZEN', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ kycStatus: 1 });
customerSchema.index({ createdAt: -1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
export default Customer;
