import { Types } from 'mongoose';
import { SupportTicket, ISupportTicket } from '../models/SupportTicket';
import { TicketMessage, ITicketMessage } from '../models/TicketMessage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a support ticket.
 */
export async function createTicket(params: {
  customerId: Types.ObjectId;
  subject: string;
  category: ISupportTicket['category'];
  priority?: ISupportTicket['priority'];
  initialMessage: string;
}): Promise<ISupportTicket> {
  const ticketNumber = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;

  const ticket = await SupportTicket.create({
    customerId: params.customerId,
    ticketNumber,
    subject: params.subject,
    category: params.category,
    priority: params.priority || 'MEDIUM',
    status: 'OPEN',
    lastMessageAt: new Date(),
  });

  // Create initial message
  await TicketMessage.create({
    ticketId: ticket._id,
    senderId: params.customerId,
    senderType: 'CUSTOMER',
    message: params.initialMessage,
  });

  return ticket;
}

/**
 * Add a message to a ticket.
 */
export async function addMessage(params: {
  ticketId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderType: 'CUSTOMER' | 'EMPLOYEE';
  message: string;
  isInternal?: boolean;
}): Promise<ITicketMessage> {
  const message = await TicketMessage.create({
    ticketId: params.ticketId,
    senderId: params.senderId,
    senderType: params.senderType,
    message: params.message,
    isInternal: params.isInternal || false,
  });

  await SupportTicket.findByIdAndUpdate(params.ticketId, {
    lastMessageAt: new Date(),
  });

  return message;
}

/**
 * Get tickets for a customer.
 */
export async function getCustomerTickets(customerId: Types.ObjectId): Promise<ISupportTicket[]> {
  return SupportTicket.find({ customerId }).sort({ lastMessageAt: -1 });
}

/**
 * Get all tickets (admin).
 */
export async function getAllTickets(options: {
  status?: string;
  priority?: string;
  assignedTo?: Types.ObjectId;
  page?: number;
  limit?: number;
}): Promise<{ data: ISupportTicket[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, ...filters } = options;

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;

  const total = await SupportTicket.countDocuments(query);
  const data = await SupportTicket.find(query)
    .sort({ lastMessageAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('customerId', 'fullName email')
    .populate('assignedTo', 'fullName email')
    .lean();

  return {
    data: data as unknown as ISupportTicket[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get ticket messages.
 */
export async function getTicketMessages(
  ticketId: Types.ObjectId,
  includeInternal: boolean = false
): Promise<ITicketMessage[]> {
  const query: Record<string, unknown> = { ticketId };
  if (!includeInternal) {
    query.isInternal = false;
  }
  return TicketMessage.find(query).sort({ createdAt: 1 });
}

/**
 * Assign a ticket.
 */
export async function assignTicket(
  ticketId: Types.ObjectId,
  assignedTo: Types.ObjectId
): Promise<ISupportTicket> {
  const ticket = await SupportTicket.findByIdAndUpdate(
    ticketId,
    { assignedTo, status: 'IN_PROGRESS' },
    { new: true }
  );
  if (!ticket) throw new Error('Ticket not found');
  return ticket;
}

/**
 * Update ticket status.
 */
export async function updateTicketStatus(
  ticketId: Types.ObjectId,
  status: ISupportTicket['status']
): Promise<ISupportTicket> {
  const ticket = await SupportTicket.findByIdAndUpdate(
    ticketId,
    { status },
    { new: true }
  );
  if (!ticket) throw new Error('Ticket not found');
  return ticket;
}
