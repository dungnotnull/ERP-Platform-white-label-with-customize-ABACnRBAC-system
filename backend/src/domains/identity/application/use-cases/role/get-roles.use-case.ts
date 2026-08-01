import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { RoleOutput } from '@/domains/identity/application/dtos/role.dtos';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';

export interface GetRolesInput {
  page?: number;
  limit?: number;
}

export interface PaginatedRolesOutput {
  items: RoleOutput[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetRolesUseCase implements IUseCase<GetRolesInput, PaginatedRolesOutput> {
  constructor(
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(input: GetRolesInput): Promise<PaginatedRolesOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 100;
    const result = await this.roleRepository.findAll(page, limit);

    return {
      items: result.items.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        endpointPermissionIds: role.endpointPermissionIds,
        departmentIds: role.departmentIds,
        isSystem: role.isSystem,
        status: role.status,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
