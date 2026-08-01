import { SupplierEntity } from '@/domains/organization/domain/entities/supplier.entity';
import { PaginatedResult } from './department.repository.port';

export interface SupplierFilterInput {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SupplierRepositoryPort {
  findById(id: string): Promise<SupplierEntity | null>;
  findPaginated(
    filter: SupplierFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<SupplierEntity>>;
  save(supplier: SupplierEntity): Promise<SupplierEntity>;
  delete(id: string): Promise<void>;
}
