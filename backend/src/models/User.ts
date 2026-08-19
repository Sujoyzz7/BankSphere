import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  role: 'CUSTOMER' | 'TELLER' | 'CUSTOMER_SERVICE' | 'LOAN_OFFICER' | 'COMPLIANCE_OFFICER' | 'BRANCH_MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
  customerId?: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: ['CUSTOMER', 'TELLER', 'CUSTOMER_SERVICE', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      required: true,
      default: 'CUSTOMER',
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
