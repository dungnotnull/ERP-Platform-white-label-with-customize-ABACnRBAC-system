import { UserEntity } from '@/domains/identity/domain/entities/user.entity';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFilterInput {
  search?: string;
  status?: string;
  roleId?: string;
  departmentId?: string;
}

export interface UserRepositoryPort {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findPaginated(filter: UserFilterInput, page: number, limit: number): Promise<PaginatedResult<UserEntity>>;
  save(user: UserEntity): Promise<UserEntity>;
  existsByEmail(email: string): Promise<boolean>;
  bumpPermVersion(userId: string): Promise<void>;
  findByRoleId(roleId: string): Promise<UserEntity[]>;
}
