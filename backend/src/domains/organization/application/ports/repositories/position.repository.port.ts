import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';

export interface PositionLookupOptions {
  includeDeleted?: boolean;
}

export interface PositionRepositoryPort {
  findById(id: string): Promise<PositionEntity | null>;
  findActiveByName(name: string): Promise<PositionEntity | null>;
  findByName(name: string, options?: PositionLookupOptions): Promise<PositionEntity | null>;
  findActiveByNameVi(nameVi: string): Promise<PositionEntity | null>;
  findByNameVi(nameVi: string, options?: PositionLookupOptions): Promise<PositionEntity | null>;
  findActiveByLevel(level: number): Promise<PositionEntity | null>;
  findByLevel(level: number, options?: PositionLookupOptions): Promise<PositionEntity | null>;
  findAll(search?: string): Promise<PositionEntity[]>;
  findByIds(ids: string[]): Promise<PositionEntity[]>;
  save(position: PositionEntity): Promise<PositionEntity>;
}
