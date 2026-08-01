import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ActivityLogMongooseModule } from './infrastructure/persistence/activity-log-mongoose.module';
import { ActivityLogRepository } from './infrastructure/persistence/repositories/activity-log.repository';
import { LogCleanupScheduler } from './infrastructure/services/log-cleanup.scheduler';
import { ActivityLogBuffer } from './infrastructure/services/activity-log-buffer';
import { GetActivityLogsUseCase } from './application/use-cases/get-activity-logs.use-case';
import { ActivityLogController } from './presentation/controllers/activity-log.controller';
import { ActivityLoggingInterceptor } from './presentation/interceptors/activity-logging.interceptor';

@Module({
  imports: [ActivityLogMongooseModule, ScheduleModule.forRoot()],
  controllers: [ActivityLogController],
  providers: [
    GetActivityLogsUseCase,
    ActivityLogRepository,
    { provide: 'ActivityLogRepositoryPort', useExisting: ActivityLogRepository },
    ActivityLogBuffer,
    ActivityLoggingInterceptor,
    LogCleanupScheduler,
  ],
  exports: [
    ActivityLoggingInterceptor,
    ActivityLogBuffer,
    'ActivityLogRepositoryPort',
  ],
})
export class ActivityLogModule {}
