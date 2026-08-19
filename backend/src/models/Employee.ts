import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  userId: mongoose.Types.ObjectId;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'TELLER' | 'CUSTOMER_SERVICE' | 'LOAN_OFFICER' | 'COMPLIANCE_OFFICER' | 'BRANCH_MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
  department: string;
  branchId?: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    employeeNumber: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['TELLER', 'CUSTOMER_SERVICE', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      required: true,
    },
    department: { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ role: 1 });
employeeSchema.index({ branchId: 1 });
employeeSchema.index({ status: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
export default Employee;
