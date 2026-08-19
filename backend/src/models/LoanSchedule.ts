import mongoose, { Schema, Document } from 'mongoose';

export interface ILoanSchedule extends Document {
  loanId: mongoose.Types.ObjectId;
  installmentNumber: number;
  dueDate: Date;
  principalMinorUnits: number;
  interestMinorUnits: number;
  totalMinorUnits: number;
  paidAmountMinorUnits: number;
  paidDate?: Date;
  transactionId?: mongoose.Types.ObjectId;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  createdAt: Date;
  updatedAt: Date;
}

const loanScheduleSchema = new Schema<ILoanSchedule>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    principalMinorUnits: { type: Number, required: true },
    interestMinorUnits: { type: Number, required: true },
    totalMinorUnits: { type: Number, required: true },
    paidAmountMinorUnits: { type: Number, required: true, default: 0 },
    paidDate: { type: Date },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE', 'PARTIAL'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

loanScheduleSchema.index({ loanId: 1, installmentNumber: 1 });
loanScheduleSchema.index({ dueDate: 1, status: 1 });

export const LoanSchedule = mongoose.model<ILoanSchedule>('LoanSchedule', loanScheduleSchema);
export default LoanSchedule;
