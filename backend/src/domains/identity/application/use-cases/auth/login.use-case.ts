import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { LoginInput, AuthResultOutput } from '@/domains/identity/application/dtos/auth.dtos';
import { InvalidCredentialsException } from '@/domains/identity/domain/exceptions/invalid-credentials.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { PasswordHasherPort } from '@/domains/identity/application/ports/services/password-hasher.port';
import { TokenGeneratorPort } from '@/domains/identity/application/ports/services/token-generator.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoginUseCase implements IUseCase<LoginInput, AuthResultOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('PasswordHasherPort') private readonly passwordHasher: PasswordHasherPort,
    @Inject('TokenGeneratorPort') private readonly tokenGenerator: TokenGeneratorPort,
    @Inject('BitmapComputationService') private readonly bitmapComputer: IBitmapComputationService,
  ) {}

  async execute(input: LoginInput): Promise<AuthResultOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.password);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    user.recordLogin('EMAIL');
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
