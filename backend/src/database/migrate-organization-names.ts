import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Logger } from '@nestjs/common';

dotenv.config({ path: '.env.local' });
dotenv.config();

const logger = new Logger('MigrateOrganizationNames');

const LEGACY_POSITION_NAME_INDEX = 'name_1';
const POSITION_NAME_VI_INDEX = 'nameVi_1';

async function migrateCollection(
  db: mongoose.mongo.Db,
  collectionName: string,
): Promise<void> {
  const collection = db.collection(collectionName);
  const filter = {
    name: { $exists: true },
    nameVi: { $exists: false },
  };

  const cursor = collection.find(filter);
  let migrated = 0;

  for await (const doc of cursor) {
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          nameVi: doc.name,
          nameJa: doc.nameJa ?? '',
        },
        $unset: { name: '' },
      },
    );
    migrated += 1;
  }

  logger.log(`${collectionName}: migrated ${migrated} document(s) from legacy name`);
}

async function backfillPositionNameViFromLegacyName(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collection = db.collection('positions');
  const filter = {
    name: { $exists: true, $type: 'string', $ne: '' },
    $or: [{ nameVi: { $exists: false } }, { nameVi: '' }],
  };

  const result = await collection.updateMany(filter, [
    {
      $set: {
        nameVi: '$name',
        nameJa: { $ifNull: ['$nameJa', ''] },
      },
    },
  ]);

  logger.log(
    `positions: backfilled nameVi on ${result.modifiedCount} document(s)`,
  );
}

async function dropLegacyPositionNameIndex(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collection = db.collection('positions');
  let indexes: mongoose.mongo.IndexDescriptionInfo[];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code !== 26) {
      throw error;
    }
    logger.log('positions: collection not found, skipping legacy index drop');
    return;
  }

  const indexNames = indexes.map((idx) => idx.name);

  if (indexNames.includes(LEGACY_POSITION_NAME_INDEX)) {
    await collection.dropIndex(LEGACY_POSITION_NAME_INDEX);
    logger.log('positions: dropped legacy unique index name_1');
  } else {
    logger.log('positions: legacy index name_1 not found (already dropped)');
  }
}

async function normalizePositionIsDeletedFlag(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collection = db.collection('positions');
  const result = await collection.updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );
  logger.log(
    `positions: set isDeleted=false on ${result.modifiedCount} document(s)`,
  );
}

async function ensurePositionNameViIndex(db: mongoose.mongo.Db): Promise<void> {
  const collection = db.collection('positions');
  let indexes: mongoose.mongo.IndexDescriptionInfo[];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code !== 26) {
      throw error;
    }
    indexes = [];
  }

  const indexNames = indexes.map((idx) => idx.name);

  if (!indexNames.includes(POSITION_NAME_VI_INDEX)) {
    await collection.createIndex(
      { nameVi: 1 },
      {
        name: POSITION_NAME_VI_INDEX,
        unique: true,
        partialFilterExpression: { isDeleted: false },
        background: true,
      },
    );
    logger.log('positions: created unique index nameVi_1');
  } else {
    logger.log('positions: nameVi_1 index already exists');
  }
}

async function removeLegacyPositionNameField(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collection = db.collection('positions');
  const result = await collection.updateMany(
    { name: { $exists: true } },
    { $unset: { name: '' } },
  );
  logger.log(
    `positions: removed legacy name field from ${result.modifiedCount} document(s)`,
  );
}

export async function migrateOrganizationNames(
  db: mongoose.mongo.Db,
): Promise<void> {
  await migrateCollection(db, 'departments');

  await dropLegacyPositionNameIndex(db);
  await migrateCollection(db, 'positions');
  await backfillPositionNameViFromLegacyName(db);
  await removeLegacyPositionNameField(db);
  await normalizePositionIsDeletedFlag(db);
  await ensurePositionNameViIndex(db);
}

async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    throw new Error('MONGODB_URI and DB_NAME are required');
  }

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not available');
  }

  await migrateOrganizationNames(db);

  await mongoose.disconnect();
  logger.log('Migration completed');
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.error('Migration failed', error);
    process.exit(1);
  });
}
