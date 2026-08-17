import 'server-only';
import { ObjectId, type Collection, type Filter, type Sort } from 'mongodb';

import type { PageRequest } from '@/domain/entity/PageRequest';
import { MOVEMENTS_COLLECTION, type MovementEntity } from '@/infrastructure/adapters/output/data/MovementEntity';
import type { MovementDocument } from '@/infrastructure/adapters/output/mapper/MovementDboMapper';
import { MongoConfiguration } from '@/infrastructure/config/MongoConfiguration';

/** Newest first; `_id` breaks ties so two movements sharing an instant never swap pages. */
const DEFAULT_SORT: Sort = { dateTime: -1, _id: -1 };

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/** Access to the `movements` collection. The only place that speaks MongoDB. */
export class MovementMongoRepository {
  private async collection(): Promise<Collection<MovementEntity>> {
    const db = await MongoConfiguration.db();
    return db.collection<MovementEntity>(MOVEMENTS_COLLECTION);
  }

  /** `null` when the text is not a valid ObjectId, so the caller can answer 404 instead of blowing up. */
  toObjectId(id: string): ObjectId | null {
    return OBJECT_ID_PATTERN.test(id) ? new ObjectId(id) : null;
  }

  async findById(id: ObjectId): Promise<MovementEntity | null> {
    const collection = await this.collection();
    return collection.findOne({ _id: id });
  }

  /** The slice is cut in the database with skip/limit: the browser never receives the whole collection. */
  async findPage(filter: Filter<MovementEntity>, pageRequest: PageRequest): Promise<MovementEntity[]> {
    const collection = await this.collection();
    return collection
      .find(filter)
      .sort(DEFAULT_SORT)
      .skip(pageRequest.page * pageRequest.size)
      .limit(pageRequest.size)
      .toArray();
  }

  async count(filter: Filter<MovementEntity>): Promise<number> {
    const collection = await this.collection();
    return collection.countDocuments(filter);
  }

  /**
   * The values a field takes across the collection, with no duplicates. `distinct` runs
   * inside MongoDB and walks the field's index where there is one, so the browser never
   * receives a row just to find out which entities exist.
   */
  async distinctValues(field: 'bankEntityId' | 'currency'): Promise<string[]> {
    const collection = await this.collection();
    const values = await collection.distinct(field);
    return values.filter((value): value is string => typeof value === 'string' && value.length > 0);
  }

  async insert(document: MovementDocument): Promise<ObjectId> {
    const collection = await this.collection();
    const result = await collection.insertOne(document as MovementEntity);
    return result.insertedId;
  }

  async replace(id: ObjectId, document: MovementDocument): Promise<boolean> {
    const collection = await this.collection();
    const result = await collection.replaceOne({ _id: id }, document as MovementEntity);
    return result.matchedCount > 0;
  }

  async deleteById(id: ObjectId): Promise<boolean> {
    const collection = await this.collection();
    const result = await collection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
