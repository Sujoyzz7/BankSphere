import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'CUSTOMER' | 'EMPLOYEE';
  message: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderType: {
      type: String,
      enum: ['CUSTOMER', 'EMPLOYEE'],
      required: true,
    },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    isInternal: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ticketMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const TicketMessage = mongoose.model<ITicketMessage>('TicketMessage', ticketMessageSchema);
export default TicketMessage;
