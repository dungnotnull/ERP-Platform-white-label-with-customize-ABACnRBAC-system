import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { RegisterInput, AuthResultOutput } from '@/domains/identity/application/dtos/auth.dtos';
import { UserEntity } from '@/domains/identity/domain/entities/user.entity';
import { AccountEntity } from '@/domains/identity/domain/entities/account.entity';
import { EmailVo } from '@/domains/identity/domain/value-objects/email.vo';
import { PasswordVo } from '@/domains/identity/domain/value-objects/password.vo';
import { EmailAlreadyExistsException } from '@/domains/identity/domain/exceptions/email-already-exists.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { AccountRepositoryPort } from '@/domains/identity/application/ports/repositories/account.repository.port';
import { PasswordHasherPort } from '@/domains/identity/application/ports/services/password-hasher.port';
import { TokenGeneratorPort } from '@/domains/identity/application/ports/services/token-generator.port';
import { UserStatusEnum } from '@/shared/domain/enums/user.enum';
import { AccountProviderEnum } from '@/shared/domain/enums/account-provider.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RegisterUseCase implements IUseCase<RegisterInput, AuthResultOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('AccountRepositoryPort') private readonly accountRepository: AccountRepositoryPort,
    @Inject('PasswordHasherPort') private readonly passwordHasher: PasswordHasherPort,
    @Inject('TokenGeneratorPort') private readonly tokenGenerator: TokenGeneratorPort,
  ) {}

  async execute(input: RegisterInput): Promise<AuthResultOutput> {
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
      status: UserStatusEnum.ONBOARDING,
      roleIds: [],
      permVersion: 1,
      isSuperadmin: false,
      departmentIds: [],
      onBoardingCompleted: false,
    });

    const savedUser = await this.userRepository.save(user);
    const userId = savedUser.id;

    const account = new AccountEntity('', {
      userId,
      provider: AccountProviderEnum.EMAIL,
      providerId: email.value,
    });

    await this.accountRepository.save(account);

    // New users have no roles yet, so bitmap is empty
    const accessToken = this.tokenGenerator.generateAccessToken({
      sub: userId,
      email: savedUser.email,
      pv: savedUser.permVersion,
      perms: Buffer.alloc(0).toString('base64'),
      sad: savedUser.isSuperadmin,
      dept: savedUser.departmentId ?? '',
      rids: [],
    });
    const refreshToken = this.tokenGenerator.generateRefreshToken({
      sub: userId,
      tokenId: uuidv4(),
    });

    return {
      tokens: { accessToken, refreshToken },
      user: this.mapUserToOutput(savedUser),
    };
  }

  private mapUserToOutput(user: UserEntity): AuthResultOutput['user'] {
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
