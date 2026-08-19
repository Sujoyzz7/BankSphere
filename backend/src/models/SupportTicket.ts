import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  customerId: mongoose.Types.ObjectId;
  ticketNumber: string;
  subject: string;
  category: 'ACCOUNT' | 'TRANSACTION' | 'CARD' | 'LOAN' | 'KYC' | 'TECHNICAL' | 'FRAUD' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  assignedTo?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ['ACCOUNT', 'TRANSACTION', 'CARD', 'LOAN', 'KYC', 'TECHNICAL', 'FRAUD', 'OTHER'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export default SupportTicket;
