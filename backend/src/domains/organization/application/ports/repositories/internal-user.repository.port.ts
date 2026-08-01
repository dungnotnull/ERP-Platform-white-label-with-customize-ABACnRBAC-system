import { InternalUserEntity } from '@/domains/organization/domain/entities/internal-user.entity';
import { PaginatedResult } from './department.repository.port';

export interface InternalUserFilterInput {
  search?: string;
  departmentId?: string;
  positionId?: string;
  isActive?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface InternalUserLookupOptions {
  /** Gồm bản ghi đã xóa mềm (dùng cho import khôi phục) */
  includeDeleted?: boolean;
}

export interface InternalUserOverviewRow {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  isActive: boolean;
  role: string;
}

export interface InternalUserRepositoryPort {
  findById(id: string): Promise<InternalUserEntity | null>;
  /** Chỉ user chưa xóa mềm — dùng khi kiểm tra email trùng. */
  findActiveByEmail(email: string): Promise<InternalUserEntity | null>;
  findByEmail(
    email: string,
    options?: InternalUserLookupOptions,
  ): Promise<InternalUserEntity | null>;
  findByEmployeeCode(
    employeeCode: string,
    options?: InternalUserLookupOptions,
  ): Promise<InternalUserEntity | null>;
  findPaginated(
    filter: InternalUserFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<InternalUserEntity>>;
  save(user: InternalUserEntity): Promise<InternalUserEntity>;
  findForExport(): Promise<InternalUserEntity[]>;
  findAllForDepartmentOverview(): Promise<InternalUserOverviewRow[]>;
  countByDepartmentId(departmentId: string): Promise<number>;
  bulkUpdateDeviceSummaries(
    updates: {
      userId: string;
      total: number;
      activeAssignments: number;
    }[],
  ): Promise<void>;
}
