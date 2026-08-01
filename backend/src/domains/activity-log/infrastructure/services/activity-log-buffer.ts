import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from '../persistence/schemas/activity-log.schema';
import { ActivityLogEntity } from '../../domain/entities/activity-log.entity';

const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 50;

@Injectable()
export class ActivityLogBuffer implements OnModuleDestroy {
  private readonly logger = new Logger(ActivityLogBuffer.name);
  private buffer: ActivityLogEntity[] = [];
  private flushing = false;

  constructor(
    @InjectModel(ActivityLog.name, 'activityLogs')
    private readonly model: Model<ActivityLogDocument>,
  ) {}

  push(entry: ActivityLogEntity): void {
    this.buffer.push(entry);
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;

    this.flushing = true;
    const batch = this.buffer;
    this.buffer = [];

    try {
      await this.model.insertMany(
        batch.map((e) => ({
          userId: e.userId,
          userEmail: e.userEmail,
          userName: e.userName,
          isSuperadmin: e.isSuperadmin,
          action: e.action,
          method: e.method,
          endpoint: e.endpoint,
          statusCode: e.statusCode,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
          requestBody: e.requestBody,
          responseTimeMs: e.responseTimeMs,
          timestamp: e.timestamp,
        })),
        { ordered: false },
      );
    } catch (error) {
      this.logger.error(`Failed to flush ${batch.length} log entries, re-buffering`, error);
      this.buffer = [...batch, ...this.buffer];
    } finally {
      this.flushing = false;
    }
  }

  @Interval(FLUSH_INTERVAL_MS)
  scheduledFlush(): void {
    void this.flush();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log(`Shutting down: flushing ${this.buffer.length} remaining log entries`);
    await this.flush();
  }
}
