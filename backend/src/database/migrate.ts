import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Logger } from '@nestjs/common';
import { migrateOrganizationNames } from './migrate-organization-names';
import { migrateInternalUserRefs } from './migrate-internal-user-department-ids';
import { migrateInternalUserIndexes } from './migrate-internal-user-indexes';

dotenv.config({ path: '.env.local' });
dotenv.config();

const logger = new Logger('MigrateAll');

const STEPS: Array<{
  name: string;
  run: (db: mongoose.mongo.Db) => Promise<void>;
}> = [
  { name: 'organization-names', run: migrateOrganizationNames },
  { name: 'internal-user-refs', run: migrateInternalUserRefs },
  { name: 'internal-user-indexes', run: migrateInternalUserIndexes },
];

async function bootstrap(): Promise<void> {
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

  logger.log(`Connected to database: ${dbName}`);
  logger.log(`Running ${STEPS.length} migration step(s)...`);

  for (const step of STEPS) {
    logger.log(`--- [${step.name}] ---`);
    await step.run(db);
  }

  await mongoose.disconnect();
  logger.log('All migrations completed.');
}

bootstrap().catch((error) => {
  logger.error('Migration failed', error);
  process.exit(1);
});
