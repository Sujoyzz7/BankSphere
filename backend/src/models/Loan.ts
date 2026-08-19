import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  customerId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  loanType: 'PERSONAL' | 'HOME' | 'EDUCATION' | 'BUSINESS' | 'EMERGENCY';
  principalAmountMinorUnits: number;
  interestRate: number;
  tenureMonths: number;
  emiAmountMinorUnits: number;
  totalPayableMinorUnits: number;
  paidAmountMinorUnits: number;
  remainingAmountMinorUnits: number;
  disbursedAccountId?: mongoose.Types.ObjectId;
  status: 'APPLIED' | 'DOCUMENT_REVIEW' | 'CREDIT_REVIEW' | 'APPROVED' | 'REJECTED' | 'AGREEMENT' | 'DISBURSED' | 'REPAYMENT' | 'CLOSED';
  approvedBy?: mongoose.Types.ObjectId;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  appliedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    loanType: {
      type: String,
      enum: ['PERSONAL', 'HOME', 'EDUCATION', 'BUSINESS', 'EMERGENCY'],
      required: true,
    },
    principalAmountMinorUnits: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    emiAmountMinorUnits: { type: Number, required: true },
    totalPayableMinorUnits: { type: Number, required: true },
    paidAmountMinorUnits: { type: Number, required: true, default: 0 },
    remainingAmountMinorUnits: { type: Number, required: true },
    disbursedAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    status: {
      type: String,
      enum: ['APPLIED', 'DOCUMENT_REVIEW', 'CREDIT_REVIEW', 'APPROVED', 'REJECTED', 'AGREEMENT', 'DISBURSED', 'REPAYMENT', 'CLOSED'],
      default: 'APPLIED',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    rejectionReason: { type: String },
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ status: 1 });
loanSchema.index({ loanType: 1 });
loanSchema.index({ createdAt: -1 });

export const Loan = mongoose.model<ILoan>('Loan', loanSchema);
export default Loan;
