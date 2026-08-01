import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '@/app.module';
import { User, UserDocument } from '@/domains/identity/infrastructure/persistence/schemas/user.schema';
import { DEFAULT_VISIBLE_MENUS } from '@/shared/domain/constants/user.constants';

const logger = new Logger('Migration:UpdateVisibleMenus');

async function updateVisibleMenusForAllUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken('User')) as any;

  try {
    logger.log('Starting migration: Update visibleMenus for all users...');

    const result = await userModel.updateMany(
      {
        isSuperadmin: { $ne: true },
        $or: [
          { visibleMenus: { $exists: false } },
          { visibleMenus: { $eq: null } },
          { visibleMenus: { $eq: [] } },
          { visibleMenus: { $eq: undefined } }
        ]
      },
      {
        $set: {
          visibleMenus: DEFAULT_VISIBLE_MENUS
        }
      }
    );

    logger.log(`Migration completed! Updated ${result.modifiedCount || result.matchedCount || 0} users.`);

    const superadminCount = await userModel.countDocuments({ isSuperadmin: true });
    logger.log(`Skipped ${superadminCount} superadmin users (they will see all menus).`);

  } catch (error) {
    logger.error('Migration failed!', error);
    throw error;
  } finally {
    await app.close();
  }
}

updateVisibleMenusForAllUsers()
  .then(() => {
    logger.log('Migration script finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script failed!', error);
    process.exit(1);
  });
