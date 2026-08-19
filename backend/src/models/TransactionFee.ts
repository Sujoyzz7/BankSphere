import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionFee extends Document {
  transactionType: string;
  feeType: 'FLAT' | 'PERCENTAGE';
  feeValue: number;
  minFeeMinorUnits?: number;
  maxFeeMinorUnits?: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionFeeSchema = new Schema<ITransactionFee>(
  {
    transactionType: { type: String, required: true, unique: true },
    feeType: {
      type: String,
      enum: ['FLAT', 'PERCENTAGE'],
      required: true,
    },
    feeValue: { type: Number, required: true },
    minFeeMinorUnits: { type: Number },
    maxFeeMinorUnits: { type: Number },
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const TransactionFee = mongoose.model<ITransactionFee>('TransactionFee', transactionFeeSchema);
export default TransactionFee;
