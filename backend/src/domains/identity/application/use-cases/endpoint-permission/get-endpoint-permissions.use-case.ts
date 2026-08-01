import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { EndpointPermissionOutput } from '@/domains/identity/application/dtos/endpoint-permission.dtos';
import { EndpointPermissionRepositoryPort, EndpointPermissionFilterInput } from '@/domains/identity/application/ports/repositories/endpoint-permission.repository.port';

export interface GetEndpointPermissionsInput {
  page?: number;
  limit?: number;
  filter?: EndpointPermissionFilterInput;
}

export interface PaginatedEndpointPermissionsOutput {
  items: EndpointPermissionOutput[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetEndpointPermissionsUseCase implements IUseCase<GetEndpointPermissionsInput, PaginatedEndpointPermissionsOutput> {
  constructor(
    @Inject('EndpointPermissionRepositoryPort') private readonly endpointPermissionRepository: EndpointPermissionRepositoryPort,
  ) {}

  async execute(input: GetEndpointPermissionsInput): Promise<PaginatedEndpointPermissionsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const result = await this.endpointPermissionRepository.findAll(page, limit, input.filter);

    return {
      items: result.items.map((ep) => ({
        id: ep.id,
        method: ep.method,
        pathPattern: ep.pathPattern,
        module: ep.module,
        permission: ep.permission,
        bitIndex: ep.bitIndex,
        isActive: ep.isActive,
        description: ep.description,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
