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

/**
 * One row of the totals aggregation: the currency grouped by, and what its movements add
 * up to. `_id` is null for a document with no currency, and `total` arrives as a
 * Decimal128 unless every amount in the group failed to convert.
 */
export interface CurrencyTotalDocument {
  _id: string | null;
  total: Decimal128 | number;
  count: number;
}
