import type { Decimal128, ObjectId } from 'mongodb';

export const MOVEMENTS_COLLECTION = 'movements';

/**
 * The document as it lives in MongoDB.
 *
 * `amount` is stored as Decimal128: the only MongoDB type that represents decimal money
 * with no rounding error. Text and date fields are read defensively in the mapper,
 * because a bulk import may have left numbers or ISO strings behind.
 */
export interface MovementEntity {
  _id: ObjectId;
  dateTime: Date;
  description: string;
  currency: string;
  amount: Decimal128;
  receiptId: string | null;
  bankEntityId: string;
}
