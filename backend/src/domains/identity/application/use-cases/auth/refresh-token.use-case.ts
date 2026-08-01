import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { TokenOutput } from '@/domains/identity/application/dtos/auth.dtos';
import { UserNotFoundException } from '@/domains/identity/domain/exceptions/user-not-found.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { TokenGeneratorPort } from '@/domains/identity/application/ports/services/token-generator.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefreshTokenUseCase implements IUseCase<string, TokenOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('TokenGeneratorPort') private readonly tokenGenerator: TokenGeneratorPort,
    @Inject('BitmapComputationService') private readonly bitmapComputer: IBitmapComputationService,
  ) {}

  async execute(refreshToken: string): Promise<TokenOutput> {
    const payload = this.tokenGenerator.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UserNotFoundException(payload.sub);
    }

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
    const newRefreshToken = this.tokenGenerator.generateRefreshToken({
      sub: user.id,
      tokenId: uuidv4(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
