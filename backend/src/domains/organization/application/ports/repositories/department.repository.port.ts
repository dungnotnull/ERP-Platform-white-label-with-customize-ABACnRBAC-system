import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DepartmentLookupOptions {
  /** Gồm bản ghi đã xóa mềm (import / khôi phục) */
  includeDeleted?: boolean;
}

export interface DepartmentRepositoryPort {
  findById(id: string): Promise<DepartmentEntity | null>;
  findActiveByCode(code: string): Promise<DepartmentEntity | null>;
  findActiveByName(name: string): Promise<DepartmentEntity | null>;
  findByCode(
    code: string,
    options?: DepartmentLookupOptions,
  ): Promise<DepartmentEntity | null>;
  findByName(
    name: string,
    options?: DepartmentLookupOptions,
  ): Promise<DepartmentEntity | null>;
  findAll(search?: string): Promise<DepartmentEntity[]>;
  findAllForOverview(): Promise<DepartmentEntity[]>;
  findByIds(ids: string[]): Promise<DepartmentEntity[]>;
  save(department: DepartmentEntity): Promise<DepartmentEntity>;
  findForExport(): Promise<DepartmentEntity[]>;
  delete(id: string): Promise<void>;
  removeFromAllUsers(departmentId: string): Promise<void>;
  removeFromAllRoles(departmentId: string): Promise<void>;
  deleteById(id: string): Promise<boolean>;
}
