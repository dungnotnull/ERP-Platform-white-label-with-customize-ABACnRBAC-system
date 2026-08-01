import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { AuthResultOutput } from '@/domains/identity/application/dtos/auth.dtos';
import { UserEntity } from '@/domains/identity/domain/entities/user.entity';
import { AccountEntity } from '@/domains/identity/domain/entities/account.entity';
import { EmailVo } from '@/domains/identity/domain/value-objects/email.vo';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { AccountRepositoryPort } from '@/domains/identity/application/ports/repositories/account.repository.port';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';
import { TokenGeneratorPort } from '@/domains/identity/application/ports/services/token-generator.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { UserStatusEnum } from '@/shared/domain/enums/user.enum';
import { Roles } from '@/shared/domain/enums/role.enum';
import { AccountProviderEnum } from '@/shared/domain/enums/account-provider.enum';
import { v4 as uuidv4 } from 'uuid';

export interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

@Injectable()
export class LoginWithGoogleUseCase implements IUseCase<GoogleProfile, AuthResultOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('AccountRepositoryPort') private readonly accountRepository: AccountRepositoryPort,
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
    @Inject('TokenGeneratorPort') private readonly tokenGenerator: TokenGeneratorPort,
    @Inject('BitmapComputationService') private readonly bitmapComputer: IBitmapComputationService,
  ) { }

  async execute(profile: GoogleProfile): Promise<AuthResultOutput> {
    const email = EmailVo.create(profile.email);

    let user: UserEntity;

    let existingAccount = await this.accountRepository.findByProviderAndProviderId(
      AccountProviderEnum.GOOGLE,
      profile.sub,
    );

    // Legacy records may have stored email as providerId
    if (!existingAccount) {
      existingAccount = await this.accountRepository.findByProviderAndProviderId(
        AccountProviderEnum.GOOGLE,
        profile.email,
      );
    }

    if (existingAccount) {
      const existingUser = await this.userRepository.findById(existingAccount.userId);
      if (!existingUser) {
        throw new Error('User account not found');
      }
      user = existingUser;
    } else {
      const existingUser = await this.userRepository.findByEmail(email.value);

      if (existingUser) {
        user = existingUser;

        const googleAccount = new AccountEntity('', {
          userId: user.id,
          provider: AccountProviderEnum.GOOGLE,
          providerId: profile.sub,
        });
        await this.accountRepository.save(googleAccount);
      } else {
        const memberRole = await this.roleRepository.findByName(Roles.MEMBER);
        const roleIds = memberRole ? [memberRole.id] : [];

        user = UserEntity.create('', {
          name: profile.name,
          email: email.value,
          password: '',
          profilePicture: profile.picture,
          status: UserStatusEnum.ONBOARDING,
          roleIds,
          permVersion: 1,
          isSuperadmin: false,
          departmentIds: [],
          onBoardingCompleted: false,
        });

        const savedUser = await this.userRepository.save(user);

        const account = new AccountEntity('', {
          userId: savedUser.id,
          provider: AccountProviderEnum.GOOGLE,
          providerId: profile.sub,
        });

        await this.accountRepository.save(account);

        user = savedUser;
      }
    }

    user.recordLogin('GOOGLE');
    await this.userRepository.save(user);

    const bitmap = await this.bitmapComputer.computeBitmap(user.id);

    const accessToken = this.tokenGenerator.generateAccessToken({
      sub: user.id,
      email: user.email,
      pv: user.permVersion,
      perms: bitmap.toString('base64'),
      sad: user.isSuperadmin,
      dept: user.departmentId ?? '',
      rids: user.roleIds ?? [],
    });
    const refreshToken = this.tokenGenerator.generateRefreshToken({
      sub: user.id,
      tokenId: uuidv4(),
    });

    return {
      tokens: { accessToken, refreshToken },
      user: {
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
      },
    };
  }
}
