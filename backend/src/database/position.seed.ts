import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '@/app.module';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';
import { Position, PositionDocument } from '@/domains/organization/infrastructure/persistence/schemas/position.schema';
import {
  InternalUser,
  InternalUserDocument,
} from '@/domains/organization/infrastructure/persistence/schemas/internal-user.schema';

const POSITIONS = [
  { nameVi: 'Giám đốc', nameJa: '社長', level: 1 },
  { nameVi: 'Quản lý', nameJa: 'マネージャー', level: 2 },
  { nameVi: 'Trưởng nhóm', nameJa: 'リーダー', level: 3 },
  { nameVi: 'Phó nhóm', nameJa: 'サブリーダー', level: 4 },
  { nameVi: 'Nhân viên', nameJa: 'メンバー', level: 5 },
] as const;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const positionRepository = app.get<PositionRepositoryPort>(
    'PositionRepositoryPort',
  );
  const positionModel = app.get<Model<PositionDocument>>(
    getModelToken(Position.name),
  );
  const internalUserModel = app.get<Model<InternalUserDocument>>(
    getModelToken(InternalUser.name),
  );

  const deleted = await positionModel.deleteMany({});
  console.log(`🗑️  Cleared ${deleted.deletedCount} position record(s)`);

  const usersUpdated = await internalUserModel.updateMany(
    { positionId: { $exists: true, $ne: null } },
    { $unset: { positionId: '' } },
  );
  if (usersUpdated.modifiedCount > 0) {
    console.log(
      `⚠️  Unset positionId on ${usersUpdated.modifiedCount} internal user(s) — re-assign chức vụ sau khi seed`,
    );
  }

  for (const item of POSITIONS) {
    const entity = new PositionEntity('', {
      nameVi: item.nameVi,
      nameJa: item.nameJa,
      level: item.level,
      isDeleted: false,
    });

    const saved = await positionRepository.save(entity);
    console.log(`✅ Created: ${saved.nameVi} (${saved.nameJa}) — level ${saved.level}`);
  }

  console.log(`🎉 Position seeding completed (${POSITIONS.length} positions)`);

  await app.close();
}

bootstrap();
