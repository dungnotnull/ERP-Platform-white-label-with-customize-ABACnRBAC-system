import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UserOutput } from '@/domains/identity/application/dtos/user.dtos';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { UserNotFoundException } from '@/domains/identity/domain/exceptions/user-not-found.exception';

export interface SetSuperadminInput {
  userId: string;
  isSuperadmin: boolean;
}

@Injectable()
export class SetSuperadminUseCase implements IUseCase<SetSuperadminInput, UserOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
  ) {}

  async execute(input: SetSuperadminInput): Promise<UserOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    user.setSuperadmin(input.isSuperadmin);
    await this.userRepository.save(user);
    await this.userRepository.bumpPermVersion(input.userId);
    this.cache.invalidate(input.userId);

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
    };
  }
}
