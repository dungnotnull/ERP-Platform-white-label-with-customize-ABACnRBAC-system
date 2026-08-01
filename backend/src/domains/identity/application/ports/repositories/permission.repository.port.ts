import { PermissionEntity } from '@/domains/identity/domain/entities/permission.entity';
import { PaginatedResult } from './user.repository.port';

export interface PermissionRepositoryPort {
  findById(id: string): Promise<PermissionEntity | null>;
  findByIds(ids: string[]): Promise<PermissionEntity[]>;
  findByName(name: string): Promise<PermissionEntity | null>;
  findAll(page: number, limit: number, status?: string): Promise<PaginatedResult<PermissionEntity>>;
  save(permission: PermissionEntity): Promise<PermissionEntity>;
}
