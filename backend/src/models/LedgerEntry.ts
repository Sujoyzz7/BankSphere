import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  transactionId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  entryType: 'DEBIT' | 'CREDIT';
  debitMinorUnits: number;
  creditMinorUnits: number;
  balanceBeforeMinorUnits: number;
  balanceAfterMinorUnits: number;
  currency: string;
  description: string;
  createdAt: Date;
}

const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    entryType: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    debitMinorUnits: { type: Number, required: true, min: 0 },
    creditMinorUnits: { type: Number, required: true, min: 0 },
    balanceBeforeMinorUnits: { type: Number, required: true },
    balanceAfterMinorUnits: { type: Number, required: true },
    currency: { type: String, required: true, default: 'BDT' },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

ledgerEntrySchema.index({ transactionId: 1 });
ledgerEntrySchema.index({ accountId: 1, createdAt: -1 });
ledgerEntrySchema.index({ createdAt: -1 });

// Ledger entries are immutable - prevent updates
ledgerEntrySchema.pre('findOneAndUpdate', function () {
  throw new Error('Ledger entries are immutable');
});

ledgerEntrySchema.pre('updateOne', function () {
  throw new Error('Ledger entries are immutable');
});

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', ledgerEntrySchema);
export default LedgerEntry;
