import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginHistory extends Document {
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  success: boolean;
  failureReason?: string;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    device: { type: String },
    success: { type: Boolean, required: true },
    failureReason: { type: String },
  },
  {
    timestamps: false,
  }
);

loginHistorySchema.index({ userId: 1, timestamp: -1 });

export const LoginHistory = mongoose.model<ILoginHistory>('LoginHistory', loginHistorySchema);
export default LoginHistory;
