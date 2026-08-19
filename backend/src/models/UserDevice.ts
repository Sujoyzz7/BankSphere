import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceName: string;
  platform: string;
  lastSeenAt: Date;
  trusted: boolean;
  createdAt: Date;
}

const userDeviceSchema = new Schema<IUserDevice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    platform: { type: String, required: true },
    lastSeenAt: { type: Date, default: Date.now },
    trusted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

userDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const UserDevice = mongoose.model<IUserDevice>('UserDevice', userDeviceSchema);
export default UserDevice;
