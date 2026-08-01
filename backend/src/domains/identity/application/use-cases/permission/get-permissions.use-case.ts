import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PermissionOutput } from '@/domains/identity/application/dtos/permission.dtos';
import { PermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/permission.repository.port';

export interface GetPermissionsInput {
  page?: number;
  limit?: number;
  status?: string;
}

export interface PaginatedPermissionsOutput {
  items: PermissionOutput[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetPermissionsUseCase implements IUseCase<GetPermissionsInput, PaginatedPermissionsOutput> {
  constructor(
    @Inject('PermissionRepositoryPort') private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(input: GetPermissionsInput): Promise<PaginatedPermissionsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const result = await this.permissionRepository.findAll(page, limit, input.status);

    return {
      items: result.items.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
