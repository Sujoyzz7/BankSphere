import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  accountNumber: string;
  customerId: mongoose.Types.ObjectId;
  accountType: 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT';
  currency: string;
  balanceMinorUnits: number;
  availableBalanceMinorUnits: number;
  blockedAmountMinorUnits: number;
  interestRate: number;
  status: 'PENDING' | 'ACTIVE' | 'DORMANT' | 'FROZEN' | 'SUSPENDED' | 'CLOSED';
  branchId: mongoose.Types.ObjectId;
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    accountNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    accountType: {
      type: String,
      enum: ['SAVINGS', 'CURRENT', 'FIXED_DEPOSIT'],
      required: true,
    },
    currency: { type: String, required: true, default: 'BDT' },
    balanceMinorUnits: { type: Number, required: true, default: 0, min: 0 },
    availableBalanceMinorUnits: { type: Number, required: true, default: 0, min: 0 },
    blockedAmountMinorUnits: { type: Number, required: true, default: 0, min: 0 },
    interestRate: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'DORMANT', 'FROZEN', 'SUSPENDED', 'CLOSED'],
      default: 'PENDING',
    },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ customerId: 1, status: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ branchId: 1 });

export const Account = mongoose.model<IAccount>('Account', accountSchema);
export default Account;
