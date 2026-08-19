import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  branchCode: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  managerId?: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    branchCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Bangladesh' },
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ status: 1 });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
export default Branch;
