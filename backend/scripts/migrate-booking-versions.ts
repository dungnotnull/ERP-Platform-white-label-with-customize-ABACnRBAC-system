// Usage: npx ts-node -r tsconfig-paths/register scripts/migrate-booking-versions.ts
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI env var is required');
  }

  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;
  if (!db) {
    throw new Error('Database connection is not available');
  }
  const result = await db
    .collection('bookings')
    .updateMany(
      { version: { $exists: false } },
      { $set: { version: 0 } },
    );

  console.log(`Migration complete. Matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
