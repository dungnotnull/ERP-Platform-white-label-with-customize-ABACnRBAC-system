import { EndpointPermissionEntity } from '@/domains/identity/domain/entities/endpoint-permission.entity';
import { PaginatedResult } from './user.repository.port';

export interface EndpointPermissionFilterInput {
  module?: string;
  method?: string;
}

export interface EndpointPermissionRepositoryPort {
  findAll(page: number, limit: number, filter?: EndpointPermissionFilterInput): Promise<PaginatedResult<EndpointPermissionEntity>>;
  save(ep: EndpointPermissionEntity): Promise<EndpointPermissionEntity>;
  findById(id: string): Promise<EndpointPermissionEntity | null>;
  findByModuleMethodAndPathPattern(module: string, method: string, pathPattern: string): Promise<EndpointPermissionEntity | null>;
  delete(id: string): Promise<void>;
  findAllActive(): Promise<EndpointPermissionEntity[]>;
  nextBitIndex(): Promise<number>;
  removeFromAllRoles(permissionId: string): Promise<void>;
  findUserIdsWithPermission(epId: string): Promise<string[]>;
}
