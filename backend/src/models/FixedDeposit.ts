import mongoose, { Schema, Document } from 'mongoose';

export interface IFixedDeposit extends Document {
  customerId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  depositAmountMinorUnits: number;
  interestRate: number;
  tenureMonths: number;
  startDate: Date;
  maturityDate: Date;
  maturityAmountMinorUnits: number;
  status: 'ACTIVE' | 'MATURED' | 'CLOSED' | 'PREMATURE_CLOSED';
  prematurePenaltyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const fixedDepositSchema = new Schema<IFixedDeposit>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    depositAmountMinorUnits: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    startDate: { type: Date, required: true },
    maturityDate: { type: Date, required: true },
    maturityAmountMinorUnits: { type: Number, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'MATURED', 'CLOSED', 'PREMATURE_CLOSED'],
      default: 'ACTIVE',
    },
    prematurePenaltyRate: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

fixedDepositSchema.index({ customerId: 1, status: 1 });
fixedDepositSchema.index({ maturityDate: 1 });
fixedDepositSchema.index({ status: 1 });

export const FixedDeposit = mongoose.model<IFixedDeposit>('FixedDeposit', fixedDepositSchema);
export default FixedDeposit;
