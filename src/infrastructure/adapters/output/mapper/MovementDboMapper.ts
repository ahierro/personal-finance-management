import 'server-only';
import { Decimal128, type Filter } from 'mongodb';

import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import type { MovementEntity } from '@/infrastructure/adapters/output/data/MovementEntity';

/** Document without `_id`: MongoDB generates it on insert and it is not replaced on update. */
export type MovementDocument = Omit<MovementEntity, '_id'>;

/** Neutralises metacharacters so whatever was typed is searched as literal text. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readAmount(value: unknown): string {
  if (value === null || value === undefined) {
    return '0';
  }
  // Decimal128, Double, Int32 and string all answer toString with the exact value.
  return String(value);
}

function readDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/** Translates between the domain model and the MongoDB document. */
export class MovementDboMapper {
  toDbo(domain: Movement): MovementDocument {
    return {
      dateTime: domain.dateTime,
      description: domain.description,
      currency: domain.currency,
      amount: Decimal128.fromString(domain.amount),
      receiptId: domain.receiptId,
      bankEntityId: domain.bankEntityId,
    };
  }

  toDomain(entity: MovementEntity): Movement {
    return {
      id: entity._id.toHexString(),
      dateTime: readDate(entity.dateTime),
      description: entity.description ?? '',
      currency: entity.currency ?? '',
      amount: readAmount(entity.amount),
      receiptId: entity.receiptId ?? null,
      bankEntityId: entity.bankEntityId ?? '',
    };
  }

  /**
   * Turns the domain criteria into a MongoDB query.
   * The description is matched with an unanchored regular expression and the `i` option,
   * so "transf" finds "TRANSFERENCIA RECIBIDA" even in the middle of the text.
   */
  toDboFilter(filter: MovementFilter): Filter<MovementEntity> {
    const query: Filter<MovementEntity> = {};

    if (filter.description !== null) {
      query.description = { $regex: escapeRegExp(filter.description), $options: 'i' };
    }

    // Both are picked from a combo built out of the stored values, so they are matched
    // whole and exactly: no regular expression, and the field's index does the work.
    if (filter.bankEntityId !== null) {
      query.bankEntityId = filter.bankEntityId;
    }

    if (filter.currency !== null) {
      query.currency = filter.currency;
    }

    if (filter.from !== null || filter.to !== null) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (filter.from !== null) {
        range.$gte = filter.from;
      }
      if (filter.to !== null) {
        range.$lte = filter.to;
      }
      query.dateTime = range;
    }

    return query;
  }
}
