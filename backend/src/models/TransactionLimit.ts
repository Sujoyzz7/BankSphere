import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionLimit extends Document {
  accountType: string;
  transactionType: string;
  dailyLimitMinorUnits: number;
  monthlyLimitMinorUnits: number;
  singleTransactionLimitMinorUnits: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionLimitSchema = new Schema<ITransactionLimit>(
  {
    accountType: { type: String, required: true },
    transactionType: { type: String, required: true },
    dailyLimitMinorUnits: { type: Number, required: true },
    monthlyLimitMinorUnits: { type: Number, required: true },
    singleTransactionLimitMinorUnits: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

transactionLimitSchema.index({ accountType: 1, transactionType: 1 }, { unique: true });

export const TransactionLimit = mongoose.model<ITransactionLimit>('TransactionLimit', transactionLimitSchema);
export default TransactionLimit;
