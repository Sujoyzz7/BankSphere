import { Types } from 'mongoose';
import { Card, ICard } from '../models/Card';
import { generateMaskedCardNumber } from '../utils/helpers';

/**
 * Issue a new card.
 */
export async function issueCard(params: {
  customerId: Types.ObjectId;
  accountId: Types.ObjectId;
  cardType: ICard['cardType'];
}): Promise<ICard> {
  const now = new Date();
  const expiryYear = now.getFullYear() + 4;

  const card = await Card.create({
    customerId: params.customerId,
    accountId: params.accountId,
    cardType: params.cardType,
    maskedNumber: generateMaskedCardNumber(),
    expiryMonth: now.getMonth() + 1,
    expiryYear,
    status: 'ACTIVE',
    dailyLimitMinorUnits: 5000000, // 50,000 BDT
    monthlyLimitMinorUnits: 50000000, // 500,000 BDT
  });

  return card;
}

/**
 * Get cards for a customer.
 */
export async function getCustomerCards(customerId: Types.ObjectId): Promise<ICard[]> {
  return Card.find({ customerId }).sort({ createdAt: -1 });
}

/**
 * Block a card.
 */
export async function blockCard(cardId: Types.ObjectId, customerId: Types.ObjectId): Promise<ICard> {
  const card = await Card.findOneAndUpdate(
    { _id: cardId, customerId },
    { status: 'BLOCKED' },
    { new: true }
  );
  if (!card) throw new Error('Card not found');
  return card;
}

/**
 * Unblock a card.
 */
export async function unblockCard(cardId: Types.ObjectId, customerId: Types.ObjectId): Promise<ICard> {
  const card = await Card.findOneAndUpdate(
    { _id: cardId, customerId, status: 'BLOCKED' },
    { status: 'ACTIVE' },
    { new: true }
  );
  if (!card) throw new Error('Card not found or not blocked');
  return card;
}
