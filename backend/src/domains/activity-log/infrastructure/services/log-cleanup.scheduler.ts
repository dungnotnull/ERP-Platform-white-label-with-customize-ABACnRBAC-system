import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from '../persistence/schemas/activity-log.schema';

@Injectable()
export class LogCleanupScheduler {
  private readonly logger = new Logger(LogCleanupScheduler.name);

  constructor(
    @InjectModel(ActivityLog.name, 'activityLogs')
    private readonly model: Model<ActivityLogDocument>,
  ) {}

  @Cron('0 0 * * 0')
  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    try {
      const result = await this.model.deleteMany({ timestamp: { $lt: cutoffDate } });
      const deletedCount = result.deletedCount ?? 0;
      this.logger.log(`Activity log cleanup: removed ${deletedCount} records older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      this.logger.error('Activity log cleanup failed', error);
    }
  }
}
