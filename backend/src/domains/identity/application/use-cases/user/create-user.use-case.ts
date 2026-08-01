import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateUserInput, UserOutput } from '@/domains/identity/application/dtos/user.dtos';
import { UserEntity } from '@/domains/identity/domain/entities/user.entity';
import { EmailVo } from '@/domains/identity/domain/value-objects/email.vo';
import { EmailAlreadyExistsException } from '@/domains/identity/domain/exceptions/email-already-exists.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { PasswordHasherPort } from '@/domains/identity/application/ports/services/password-hasher.port';
import { UserStatusEnum } from '@/shared/domain/enums/user.enum';
@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserInput, UserOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('PasswordHasherPort') private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const email = EmailVo.create(input.email);

    const exists = await this.userRepository.existsByEmail(email.value);
    if (exists) {
      throw new EmailAlreadyExistsException(email.value);
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

    const user = UserEntity.create('', {
      name: input.name,
      email: email.value,
      password: hashedPassword,
      nickName: input.nickName,
      phone: input.phone,
      status: UserStatusEnum.ONBOARDING,
      roleIds: input.roleIds ?? [],
      permVersion: 1,
      isSuperadmin: false,
      departmentIds: [],
      onBoardingCompleted: false,
      createdBy: input.createdBy,
    });

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      name: saved.name,
      nickName: saved.nickName,
      bio: saved.bio,
      email: saved.email,
      profilePicture: saved.profilePicture,
      status: saved.status,
      gender: saved.gender,
      maritalStatus: saved.maritalStatus,
      birthday: saved.birthday,
      address: saved.address,
      phone: saved.phone,
      roleIds: saved.roleIds,
      isSuperadmin: saved.isSuperadmin,
      departmentIds: saved.departmentIds,
      permissions: [],
      currentTeam: saved.currentTeam,
      onBoardingCompleted: saved.onBoardingCompleted,
      lastLogin: saved.lastLogin,
    };
  }
}
