import { ApiEndpointEntity } from '@/domains/identity/domain/entities/api-endpoint.entity';

export interface ApiEndpointRepositoryPort {
  upsert(endpoint: ApiEndpointEntity): Promise<ApiEndpointEntity>;
  findAll(): Promise<ApiEndpointEntity[]>;
}
