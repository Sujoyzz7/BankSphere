import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  customerId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX';
  maskedNumber: string;
  expiryMonth: number;
  expiryYear: number;
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'PENDING';
  dailyLimitMinorUnits: number;
  monthlyLimitMinorUnits: number;
  dailySpentMinorUnits: number;
  monthlySpentMinorUnits: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    cardType: {
      type: String,
      enum: ['VISA', 'MASTERCARD', 'AMEX'],
      required: true,
    },
    maskedNumber: { type: String, required: true },
    expiryMonth: { type: Number, required: true, min: 1, max: 12 },
    expiryYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'EXPIRED', 'PENDING'],
      default: 'ACTIVE',
    },
    dailyLimitMinorUnits: { type: Number, required: true, default: 5000000 },
    monthlyLimitMinorUnits: { type: Number, required: true, default: 50000000 },
    dailySpentMinorUnits: { type: Number, required: true, default: 0 },
    monthlySpentMinorUnits: { type: Number, required: true, default: 0 },
    lastUsedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

cardSchema.index({ customerId: 1, status: 1 });
cardSchema.index({ accountId: 1 });

export const Card = mongoose.model<ICard>('Card', cardSchema);
export default Card;
