import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';

export class SystemRoleDeleteException extends Error {
  constructor() {
    super('Cannot delete system roles');
  }
}

export class RoleNotFoundException extends Error {
  constructor(id: string) {
    super(`Role not found: ${id}`);
  }
}

export interface DeleteRoleInput {
  id: string;
  forceHard?: boolean;
}

@Injectable()
export class DeleteRoleUseCase implements IUseCase<DeleteRoleInput, void> {
  constructor(
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
  ) {}

  async execute(input: DeleteRoleInput): Promise<void> {
    const role = await this.roleRepository.findById(input.id);
    if (!role) {
      throw new RoleNotFoundException(input.id);
    }
    if (role.isSystem) {
      throw new SystemRoleDeleteException();
    }

    if (input.forceHard === true) {
      const userCount = await this.roleRepository.countUsersWithRole(input.id);
      if (userCount > 0) {
        throw new ConflictException(`Cannot hard delete role: ${userCount} user(s) are assigned to this role. Remove the role from users first or use soft delete.`);
      }
      await this.roleRepository.removeFromAllUsers(input.id);
      await this.roleRepository.delete(input.id);
    } else {
      (role as any).props.isActive = false;
      await this.roleRepository.save(role);
    }

    // Bump permVersion and invalidate cache for all affected users
    const usersWithRole = await this.userRepository.findByRoleId(input.id);
    await Promise.all(
      usersWithRole.map(u => this.userRepository.bumpPermVersion(u.id)),
    );
    for (const u of usersWithRole) {
      this.cache.invalidate(u.id);
    }
  }
}
