import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Logger } from '@nestjs/common';
import { buildReleasedEmployeeCode } from '@/domains/organization/domain/utils/internal-user-employee-code.util';

dotenv.config({ path: '.env.local' });
dotenv.config();

const logger = new Logger('MigrateInternalUserIndexes');

const COLLECTION = 'internalusers';
const EMPLOYEE_CODE_INDEX = 'employeeCode_1';
const EMAIL_INDEX = 'email_1';

async function backfillReleasedEmployeeCodes(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collection = db.collection(COLLECTION);
  const cursor = collection.find({
    isDeleted: true,
    employeeCode: { $not: /^__DELETED__/ },
  });

  let updated = 0;
  for await (const doc of cursor) {
    const employeeCode = String(doc.employeeCode ?? '');
    if (!employeeCode) {
      continue;
    }

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          employeeCode: buildReleasedEmployeeCode(String(doc._id), employeeCode),
        },
      },
    );
    updated += 1;
  }

  logger.log(
    `${COLLECTION}: giải phóng employeeCode trên ${updated} bản ghi isDeleted=true`,
  );
}

async function ensurePartialUniqueIndex(
  db: mongoose.mongo.Db,
  keys: Record<string, 1 | -1>,
  indexName: string,
): Promise<void> {
  const collection = db.collection(COLLECTION);
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

  const existing = indexes.find((idx) => idx.name === indexName);

  const expectedPartial = { isDeleted: false };
  const hasExpectedPartial =
    existing?.partialFilterExpression &&
    JSON.stringify(existing.partialFilterExpression) ===
      JSON.stringify(expectedPartial);

  if (existing && !hasExpectedPartial) {
    await collection.dropIndex(indexName);
    logger.log(`${COLLECTION}: dropped legacy index ${indexName}`);
  }

  if (!existing || !hasExpectedPartial) {
    await collection.createIndex(keys, {
      name: indexName,
      unique: true,
      partialFilterExpression: expectedPartial,
      background: true,
    });
    logger.log(`${COLLECTION}: ensured partial unique index ${indexName}`);
  } else {
    logger.log(`${COLLECTION}: partial unique index ${indexName} already OK`);
  }
}

export async function migrateInternalUserIndexes(
  db: mongoose.mongo.Db,
): Promise<void> {
  await backfillReleasedEmployeeCodes(db);
  await ensurePartialUniqueIndex(db, { employeeCode: 1 }, EMPLOYEE_CODE_INDEX);
  await ensurePartialUniqueIndex(db, { email: 1 }, EMAIL_INDEX);
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    throw new Error('MONGODB_URI and DB_NAME are required');
  }

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection failed');
  }

  logger.log(`Connected to database: ${dbName}`);
  await migrateInternalUserIndexes(db);
  logger.log('Migration completed.');
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Migration failed', error);
    process.exit(1);
  });
}
