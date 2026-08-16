import 'server-only';
import { MongoClient, type Db } from 'mongodb';

import { MOVEMENTS_COLLECTION } from '@/infrastructure/adapters/output/data/MovementEntity';

/** Database used when MONGODB_URI carries no database name. */
const DEFAULT_DATABASE = 'personal_finance';

/**
 * Next.js reloads modules on every edit during development. Keeping the connection in
 * the global scope avoids opening a fresh pool on each reload.
 */
const globalForMongo = globalThis as unknown as { movementsDb?: Promise<Db> };

function readUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim().length === 0) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill in the connection string.');
  }
  return uri.trim();
}

function extractDatabaseName(uri: string): string | null {
  const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const slashIndex = withoutScheme.indexOf('/');
  if (slashIndex === -1) {
    return null;
  }
  const name = withoutScheme.slice(slashIndex + 1).split('?')[0];
  return name && name.length > 0 ? decodeURIComponent(name) : null;
}

/**
 * Indexes that hold the paginated listing up. They are the difference between an instant
 * query and a full collection scan once there are ten years of movements in there.
 */
async function ensureIndexes(db: Db): Promise<void> {
  await db.collection(MOVEMENTS_COLLECTION).createIndexes([
    // Default listing order; `_id` breaks ties so pagination stays stable.
    { key: { dateTime: -1, _id: -1 }, name: 'dateTime_-1__id_-1' },
    { key: { description: 1 }, name: 'description_1' },
    { key: { receiptId: 1 }, name: 'receiptId_1' },
    { key: { bankEntityId: 1 }, name: 'bankEntityId_1' },
  ]);
}

async function connect(): Promise<Db> {
  const uri = readUri();
  const client = new MongoClient(uri, {
    // Fail fast when the server is down instead of hanging the render.
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db(extractDatabaseName(uri) ?? DEFAULT_DATABASE);
  await ensureIndexes(db);
  return db;
}

export const MongoConfiguration = {
  /** The connected database, with its indexes already in place. Reuses the pool across requests. */
  db(): Promise<Db> {
    if (!globalForMongo.movementsDb) {
      globalForMongo.movementsDb = connect().catch((error: unknown) => {
        // Without this, one failed attempt would leave a rejected promise cached forever.
        globalForMongo.movementsDb = undefined;
        throw error;
      });
    }
    return globalForMongo.movementsDb;
  },
};
