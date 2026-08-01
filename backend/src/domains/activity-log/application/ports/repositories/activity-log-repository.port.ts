import { ActivityLogEntity } from '@/domains/activity-log/domain/entities/activity-log.entity';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLogQuery {
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

export interface ActivityLogRepositoryPort {
  create(activity: ActivityLogEntity): Promise<void>;
  findWithFilters(query: ActivityLogQuery): Promise<PaginatedResult<ActivityLogEntity>>;
  deleteOlderThan(date: Date): Promise<number>;
}
