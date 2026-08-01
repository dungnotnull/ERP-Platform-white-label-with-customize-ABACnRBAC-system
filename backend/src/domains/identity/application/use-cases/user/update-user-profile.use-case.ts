import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateUserProfileInput, UserOutput } from '@/domains/identity/application/dtos/user.dtos';
import { UserNotFoundException } from '@/domains/identity/domain/exceptions/user-not-found.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';

@Injectable()
export class UpdateUserProfileUseCase implements IUseCase<UpdateUserProfileInput, UserOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: UpdateUserProfileInput): Promise<UserOutput> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new UserNotFoundException(input.id);
    }

    user.updateProfile({
      name: input.name,
      nickName: input.nickName,
      bio: input.bio,
      profilePicture: input.profilePicture,
      gender: input.gender as any,
      maritalStatus: input.maritalStatus as any,
      birthday: input.birthday,
      address: input.address,
      phone: input.phone,
    });

    await this.userRepository.save(user);

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
