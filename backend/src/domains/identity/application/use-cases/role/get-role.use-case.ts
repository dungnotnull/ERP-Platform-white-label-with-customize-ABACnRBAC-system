import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { RoleOutput } from '@/domains/identity/application/dtos/role.dtos';
import { RoleNotFoundException } from '@/domains/identity/domain/exceptions/role-not-found.exception';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';

@Injectable()
export class GetRoleUseCase implements IUseCase<string, RoleOutput> {
  constructor(
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(id: string): Promise<RoleOutput> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      endpointPermissionIds: role.endpointPermissionIds,
      departmentIds: role.departmentIds,
      isSystem: role.isSystem,
      status: role.status,
    };
  }
}
