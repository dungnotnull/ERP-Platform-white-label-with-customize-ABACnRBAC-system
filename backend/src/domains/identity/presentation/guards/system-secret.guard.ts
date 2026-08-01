import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { REQUIRE_SYSTEM_SECRET_KEY } from '../decorators/require-system-secret.decorator';

@Injectable()
export class SystemSecretGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const requireSecret = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SYSTEM_SECRET_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireSecret) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const body = request.body || {};

    const providedSecret = body.secretKey;

    if (!providedSecret) {
      throw new BadRequestException('Invalid system credentials');
    }

    const systemSecret = this.configService.get<string>('SYSTEM_DELETE_SECRET');

    if (!systemSecret) {
      throw new BadRequestException('Invalid system credentials');
    }

    if (providedSecret !== systemSecret) {
      throw new BadRequestException('Invalid system credentials');
    }

    return true;
  }
}
