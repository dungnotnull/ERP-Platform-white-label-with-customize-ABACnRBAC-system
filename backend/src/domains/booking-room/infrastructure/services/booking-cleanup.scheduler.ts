import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../persistence/schemas/booking.schema';

@Injectable()
export class BookingCleanupScheduler {
  private readonly logger = new Logger(BookingCleanupScheduler.name);

  constructor(@InjectModel(Booking.name) private readonly model: Model<BookingDocument>) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cleanupOldBookings(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);

    try {
      const result = await this.model.deleteMany({ endTime: { $lt: cutoffDate } }).exec();
      const deletedCount = result.deletedCount || 0;
      this.logger.log(`Booking cleanup: removed ${deletedCount} records older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      this.logger.error('Booking cleanup failed', error);
    }
  }
}
