import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Logger } from '@nestjs/common';

dotenv.config({ path: '.env.local' });
dotenv.config();

const logger = new Logger('MigrateInternalUserDepartmentIds');

export async function migrateInternalUserRefs(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collection = db.collection('internalusers');

  const cursor = collection.find({
    departmentId: { $exists: true, $type: 'string' },
  });

  let migrated = 0;
  for await (const doc of cursor) {
    const raw = doc.departmentId;
    if (typeof raw !== 'string' || !/^[0-9a-fA-F]{24}$/.test(raw)) {
      continue;
    }
    await collection.updateOne(
      { _id: doc._id },
      { $set: { departmentId: new mongoose.Types.ObjectId(raw) } },
    );
    migrated += 1;
  }

  const positionCursor = collection.find({
    positionId: { $exists: true, $type: 'string' },
  });

  let positionsMigrated = 0;
  for await (const doc of positionCursor) {
    const raw = doc.positionId;
    if (typeof raw !== 'string' || !/^[0-9a-fA-F]{24}$/.test(raw)) {
      continue;
    }
    await collection.updateOne(
      { _id: doc._id },
      { $set: { positionId: new mongoose.Types.ObjectId(raw) } },
    );
    positionsMigrated += 1;
  }

  logger.log(
    `Migrated departmentId on ${migrated} user(s), positionId on ${positionsMigrated} user(s)`,
  );
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

  await migrateInternalUserRefs(db);

  await mongoose.disconnect();
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.error('Migration failed', error);
    process.exit(1);
  });
}
