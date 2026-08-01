import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateUserInput, UserOutput } from '@/domains/identity/application/dtos/user.dtos';
import { UserNotFoundException } from '@/domains/identity/domain/exceptions/user-not-found.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { UserStatusEnumType } from '@/shared/domain/enums';

@Injectable()
export class UpdateUserUseCase implements IUseCase<UpdateUserInput, UserOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
  ) { }

  async execute(input: UpdateUserInput): Promise<UserOutput> {

    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new UserNotFoundException(input.id);
    }

    user.updateAdmin({
      name: input.name,
      nickName: input.nickName,
      phone: input.phone,
      status: input.status as UserStatusEnumType | undefined,
      updatedBy: input.updatedBy,
    });

    // Update departmentIds if provided
    if (input.departmentIds !== undefined) {
      user.updateDepartmentIds(input.departmentIds);
    }

    // Validate and update roleIds if provided
    if (input.roleIds !== undefined) {
      // Skip validation for superadmins
      if (!user.isSuperadmin) {
        await this.validateRoleDepartments(user.departmentIds, input.roleIds);
      }
      user.assignRoles(input.roleIds);
    }

    if (input.visibleMenus !== undefined) {
      user.updateVisibleMenus(input.visibleMenus);
    }

    await this.userRepository.save(user);

    // Bump permVersion if roleIds changed since this affects the user's effective permissions
    if (input.roleIds !== undefined) {
      await this.userRepository.bumpPermVersion(input.id);
      this.cache.invalidate(input.id);
    }

    return {
      id: user.id,
      name: user.name,
      nickName: user.nickName,
      bio: user.bio,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      gender: user.gender,
      maritalStatus: user.maritalStatus,
      birthday: user.birthday,
      address: user.address,
      phone: user.phone,
      roleIds: user.roleIds,
      isSuperadmin: user.isSuperadmin,
      departmentIds: user.departmentIds,
      permissions: [],
      currentTeam: user.currentTeam,
      onBoardingCompleted: user.onBoardingCompleted,
      lastLogin: user.lastLogin,
      visibleMenus: user.visibleMenus,
    };
  }

  private async validateRoleDepartments(userDepartmentIds: string[], roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    // Fetch all roles
    const roles = await this.roleRepository.findByIds(roleIds);

    // Check if each role has at least one departmentId that exists in user's departmentIds
    for (const role of roles) {
      if (role?.departmentIds?.length <= 0) {
        // pass check when role have departmentIds = [] => roles for all departments
        continue;
      }
      const hasMatchingDepartment = role.departmentIds.some((deptId) =>
        userDepartmentIds.includes(deptId),
      );

      if (!hasMatchingDepartment) {
        throw new BadRequestException(
          `Role "${role.name}" cannot be assigned: its departments [${role.departmentIds.join(', ') || 'none'}] do not overlap with user's departments [${userDepartmentIds.join(', ') || 'none'}]`,
        );
      }
    }
  }
}
