import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@/config/config.service';
import { AppConfigModule } from '@/config/config.module';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { ActivityLogRepository } from './repositories/activity-log.repository';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      connectionName: 'activityLogs',
      useFactory: (configService: ConfigService) => ({
        uri: `${configService.mongodbLogSystemUri}${configService.mongodbLogSystemDbName}`,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature(
      [{ name: ActivityLog.name, schema: ActivityLogSchema }],
      'activityLogs',
    ),
  ],
  providers: [
    ActivityLogRepository,
    { provide: 'ActivityLogRepositoryPort', useClass: ActivityLogRepository },
  ],
  exports: [
    ActivityLogRepository,
    'ActivityLogRepositoryPort',
    MongooseModule,
  ],
})
export class ActivityLogMongooseModule {}
