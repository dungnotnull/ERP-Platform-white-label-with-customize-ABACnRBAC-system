import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@/config/config.service';
import { TokenGeneratorPort, AccessTokenPayload } from '@/domains/identity/application/ports/services/token-generator.port';

@Injectable()
export class JwtTokenGenerator implements TokenGeneratorPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.jwtAccessSecret,
      expiresIn: this.configService.jwtAccessExpiration as `${number}`,
    });
  }

  generateRefreshToken(payload: { sub: string; tokenId: string }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.jwtRefreshSecret,
      expiresIn: this.configService.jwtRefreshExpiration as `${number}`,
    });
  }

  verifyRefreshToken(
    token: string,
  ): { sub: string; tokenId: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.jwtRefreshSecret,
    });
  }
}
