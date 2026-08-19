import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'TRANSACTION' | 'SECURITY' | 'LOAN' | 'FD' | 'KYC' | 'SUPPORT' | 'SYSTEM';
  title: string;
  message: string;
  channel: 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS';
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['TRANSACTION', 'SECURITY', 'LOAN', 'FD', 'KYC', 'SUPPORT', 'SYSTEM'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ['IN_APP', 'PUSH', 'EMAIL', 'SMS'],
      default: 'IN_APP',
    },
    read: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
