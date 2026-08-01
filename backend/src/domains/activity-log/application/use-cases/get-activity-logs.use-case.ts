import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import {
  ActivityLogRepositoryPort,
  ActivityLogQuery,
  PaginatedResult,
} from '@/domains/activity-log/application/ports/repositories/activity-log-repository.port';
import { ActivityLogEntity } from '@/domains/activity-log/domain/entities/activity-log.entity';

export interface GetActivityLogsInput {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  method?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  statusCode?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ActivityLogOutput {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isSuperadmin: boolean | null;
  action: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestBody: Record<string, any> | null;
  responseTimeMs: number;
  timestamp: Date;
}

export type PaginatedActivityLogsOutput = PaginatedResult<ActivityLogOutput>;

@Injectable()
export class GetActivityLogsUseCase
  implements IUseCase<GetActivityLogsInput, PaginatedActivityLogsOutput>
{
  constructor(
    @Inject('ActivityLogRepositoryPort')
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(input: GetActivityLogsInput): Promise<PaginatedActivityLogsOutput> {
    const query: ActivityLogQuery = {
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      search: input.search,
      action: input.action,
      method: input.method,
      userEmail: input.userEmail,
      startDate: input.startDate,
      endDate: input.endDate,
      statusCode: input.statusCode,
      sort: input.sort ?? 'timestamp',
      order: input.order ?? 'desc',
    };

    const result = await this.activityLogRepository.findWithFilters(query);

    return {
      items: result.items.map((e) => this.toOutput(e)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private toOutput(entity: ActivityLogEntity): ActivityLogOutput {
    return {
      id: entity.id,
      userId: entity.userId,
      userEmail: entity.userEmail,
      userName: entity.userName,
      isSuperadmin: entity.isSuperadmin,
      action: entity.action,
      method: entity.method,
      endpoint: entity.endpoint,
      statusCode: entity.statusCode,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      requestBody: entity.requestBody,
      responseTimeMs: entity.responseTimeMs,
      timestamp: entity.timestamp,
    };
  }
}
