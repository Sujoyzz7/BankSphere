import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionNumber: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND' | 'INTEREST' | 'FEE' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'CARD_PAYMENT' | 'CARD_REFUND' | 'ADJUSTMENT';
  sourceAccountId?: mongoose.Types.ObjectId;
  destinationAccountId?: mongoose.Types.ObjectId;
  amountMinorUnits: number;
  feeMinorUnits: number;
  currency: string;
  description: string;
  reference?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'CANCELLED';
  riskScore: number;
  initiatedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  idempotencyKey: string;
  reversalOfTransactionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionNumber: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'INTEREST', 'FEE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'CARD_PAYMENT', 'CARD_REFUND', 'ADJUSTMENT'],
      required: true,
    },
    sourceAccountId: { type: Schema.Types.ObjectId, ref: 'Account', index: true },
    destinationAccountId: { type: Schema.Types.ObjectId, ref: 'Account', index: true },
    amountMinorUnits: { type: Number, required: true, min: 0 },
    feeMinorUnits: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: 'BDT' },
    description: { type: String, required: true },
    reference: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    riskScore: { type: Number, default: 0 },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    reversalOfTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    completedAt: { type: Date },
    failureReason: { type: String },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ sourceAccountId: 1, createdAt: -1 });
transactionSchema.index({ destinationAccountId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
