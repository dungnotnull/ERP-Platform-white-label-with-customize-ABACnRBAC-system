import { RoleEntity } from '@/domains/identity/domain/entities/role.entity';
import { PaginatedResult } from './user.repository.port';

export interface RoleRepositoryPort {
  findById(id: string): Promise<RoleEntity | null>;
  findByIds(ids: string[]): Promise<RoleEntity[]>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(page: number, limit: number): Promise<PaginatedResult<RoleEntity>>;
  findByDepartmentIds(departmentIds: string[]): Promise<RoleEntity[]>;
  save(role: RoleEntity): Promise<RoleEntity>;
  findByIdsWithActive(roleIds: string[]): Promise<RoleEntity[]>;
  delete(id: string): Promise<void>;
  countUsersWithRole(roleId: string): Promise<number>;
  removeFromAllUsers(roleId: string): Promise<void>;
}
