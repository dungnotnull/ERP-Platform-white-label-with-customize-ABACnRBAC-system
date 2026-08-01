import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateRoleInput, RoleOutput } from '@/domains/identity/application/dtos/role.dtos';
import { RoleEntity } from '@/domains/identity/domain/entities/role.entity';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';

@Injectable()
export class CreateRoleUseCase implements IUseCase<CreateRoleInput, RoleOutput> {
  constructor(
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(input: CreateRoleInput): Promise<RoleOutput> {
    const role = new RoleEntity('', {
      name: input.name,
      description: input.description,
      endpointPermissionIds: input.endpointPermissionIds ?? [],
      departmentIds: input.departmentIds ?? [],
      isSystem: false,
      isActive: true,
      status: 'ACTIVE' as any,
    });

    const saved = await this.roleRepository.save(role);

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      endpointPermissionIds: saved.endpointPermissionIds,
      departmentIds: saved.departmentIds,
      isSystem: saved.isSystem,
      status: saved.status,
    };
  }
}
