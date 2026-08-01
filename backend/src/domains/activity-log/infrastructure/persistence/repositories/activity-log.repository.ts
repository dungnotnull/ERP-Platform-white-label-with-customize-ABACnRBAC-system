import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { ActivityLogEntity } from '@/domains/activity-log/domain/entities/activity-log.entity';
import {
  ActivityLogRepositoryPort,
  ActivityLogQuery,
  PaginatedResult,
} from '@/domains/activity-log/application/ports/repositories/activity-log-repository.port';
import { ActivityLog, ActivityLogDocument } from '../schemas/activity-log.schema';

@Injectable()
export class ActivityLogRepository implements ActivityLogRepositoryPort {
  constructor(
    @InjectModel(ActivityLog.name, 'activityLogs')
    private readonly model: Model<ActivityLogDocument>,
  ) {}

  async create(activity: ActivityLogEntity): Promise<void> {
    await this.model.create({
      userId: activity.userId,
      userEmail: activity.userEmail,
      userName: activity.userName,
      isSuperadmin: activity.isSuperadmin,
      action: activity.action,
      method: activity.method,
      endpoint: activity.endpoint,
      statusCode: activity.statusCode,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      requestBody: activity.requestBody,
      responseTimeMs: activity.responseTimeMs,
      timestamp: activity.timestamp,
    });
  }

  async findWithFilters(query: ActivityLogQuery): Promise<PaginatedResult<ActivityLogEntity>> {
    const { page, limit, sort = 'timestamp', order = 'desc' } = query;

    const match: FilterQuery<ActivityLogDocument> = {};

    if (query.search) {
      match.$text = { $search: query.search };
    }

    if (query.action) {
      match.action = query.action;
    }

    if (query.method) {
      match.method = query.method.toUpperCase();
    }

    if (query.userEmail) {
      match.userEmail = { $regex: query.userEmail, $options: 'i' };
    }

    if (query.statusCode !== undefined && query.statusCode !== null) {
      match.statusCode = Number(query.statusCode);
    }

    if (query.startDate || query.endDate) {
      match.timestamp = {};
      if (query.startDate) {
        match.timestamp.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        match.timestamp.$lte = new Date(query.endDate);
      }
    }

    const sortDir = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sort]: sortDir };

    const [docs, total] = await Promise.all([
      this.model
        .find(match)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(match),
    ]);

    return {
      items: docs.map((doc) => this.toEntity(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.model.deleteMany({ timestamp: { $lt: date } });
    return result.deletedCount ?? 0;
  }

  private toEntity(doc: any): ActivityLogEntity {
    return ActivityLogEntity.create({
      userId: doc.userId ?? null,
      userEmail: doc.userEmail ?? null,
      userName: doc.userName ?? null,
      isSuperadmin: doc.isSuperadmin ?? null,
      action: doc.action,
      method: doc.method,
      endpoint: doc.endpoint,
      statusCode: doc.statusCode,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent ?? '',
      requestBody: doc.requestBody ?? null,
      responseTimeMs: doc.responseTimeMs ?? 0,
      timestamp: doc.timestamp,
    });
  }
}
