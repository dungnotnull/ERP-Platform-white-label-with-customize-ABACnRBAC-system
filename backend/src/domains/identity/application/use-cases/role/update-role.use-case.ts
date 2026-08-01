import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateRoleInput, RoleOutput } from '@/domains/identity/application/dtos/role.dtos';
import { RoleNotFoundException } from '@/domains/identity/domain/exceptions/role-not-found.exception';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';

@Injectable()
export class UpdateRoleUseCase implements IUseCase<UpdateRoleInput, RoleOutput> {
  constructor(
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
  ) { }

  async execute(input: UpdateRoleInput): Promise<RoleOutput> {
    let role = await this.roleRepository.findById(input.id);
    if (!role) {
      throw new RoleNotFoundException(input.id);
    }

    if (input.endpointPermissionIds !== undefined) {
      role.updateEndpointPermissions(input.endpointPermissionIds);
    }

    if (input.departmentIds !== undefined) {
      (role as any).props.departmentIds = input.departmentIds;
    }

    if (input.name !== undefined) {
      (role as any).props.name = input.name;
    }

    if (input.description !== undefined) {
      (role as any).props.description = input.description;
    }

    await this.roleRepository.save(role);

    // Bump permVersion for all users with this role since their effective permissions changed
    const usersWithRole = await this.userRepository.findByRoleId(role.id);
    await Promise.all(
      usersWithRole.map(u => this.userRepository.bumpPermVersion(u.id)),
    );
    for (const u of usersWithRole) {
      this.cache.invalidate(u.id);
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
