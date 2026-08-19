import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'PASSWORD_CHANGED' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'SESSION_REVOKED' | 'DEVICE_ADDED' | 'DEVICE_REVOKED' | 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED';
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const securityEventSchema = new Schema<ISecurityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: {
      type: String,
      enum: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_CHANGED', 'MFA_ENABLED', 'MFA_DISABLED', 'SESSION_REVOKED', 'DEVICE_ADDED', 'DEVICE_REVOKED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED'],
      required: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

securityEventSchema.index({ userId: 1, createdAt: -1 });
securityEventSchema.index({ eventType: 1, createdAt: -1 });

export const SecurityEvent = mongoose.model<ISecurityEvent>('SecurityEvent', securityEventSchema);
export default SecurityEvent;
