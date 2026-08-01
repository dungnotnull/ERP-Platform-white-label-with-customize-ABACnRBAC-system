import { InternalUserEntity } from '@/domains/identity/domain/entities/internal-user.entity';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface InternalUserFilterInput {
  search?: string;
  status?: string;
  roleId?: string;
}

export interface InternalUserRepositoryPort {
  findById(id: string): Promise<InternalUserEntity | null>;
  findByEmail(email: string): Promise<InternalUserEntity | null>;
  findPaginated(filter: InternalUserFilterInput, page: number, limit: number): Promise<PaginatedResult<InternalUserEntity>>;
  save(user: InternalUserEntity): Promise<InternalUserEntity>;
  existsByEmail(email: string): Promise<boolean>;
  bumpPermVersion(userId: string): Promise<void>;
  findByRoleId(roleId: string): Promise<InternalUserEntity[]>;
}
