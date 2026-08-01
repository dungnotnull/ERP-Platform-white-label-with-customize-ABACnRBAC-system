import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@/config/config.service';

interface JwtPayload {
  sub: string;
  email: string;
  pv: number;
  perms: string;
  sad: boolean;
  dept: string;
  rids: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      _id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      permVersion: payload.pv,
      bitmap: payload.perms
        ? Buffer.from(payload.perms, 'base64')
        : Buffer.alloc(0),
      isSuperadmin: payload.sad,
      departmentId: payload.dept,
      roleIds: payload.rids ?? [],
    };
  }
}
