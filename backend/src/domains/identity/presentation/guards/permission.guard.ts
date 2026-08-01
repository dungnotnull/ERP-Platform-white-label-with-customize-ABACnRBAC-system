import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AUTH_ONLY_KEY } from '../decorators/auth-only.decorator';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';
import { UserPermCacheService } from '@/domains/identity/application/services/user-perm-cache.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private routeMapService: RouteMapService,
    private userPermCacheService: UserPermCacheService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isAuthOnly = this.reflector.getAllAndOverride<boolean>(AUTH_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    if (isAuthOnly) return true;

    const checkTermSuperadmin = user?.isSuperadmin;

    const bitIndex = this.routeMapService.resolve(request.method, request.path);

    if (bitIndex === null && !checkTermSuperadmin) {
      this.logger.warn(`Unregistered endpoint: ${request.method} ${request.path}`);
      return false;
    }

    const { bitmap, isSuperadmin } = await this.userPermCacheService.resolvePermissions(
      user.userId,
      user.permVersion,
      user.bitmap,
      user.isSuperadmin,
    );

    if (isSuperadmin) return true;
    if (!bitmap) {
      throw new ForbiddenException('Access denied');
    }

    if (bitIndex === null){
 this.logger.warn(`Unregistered  lv2: ${request.method} ${request.path}`);
      return false;
    }

    const byteIndex = bitIndex >> 3;
    const bitMask = 1 << (bitIndex & 7);

    if (byteIndex >= bitmap.length) {
      throw new ForbiddenException('Access denied');
    }

    const allowed = (bitmap[byteIndex] & bitMask) !== 0;
    if (!allowed) {
      this.logger.warn(`Permission denied for user ${user.userId} on ${request.method} ${request.path} (bitIndex=${bitIndex})`);
    }
    return allowed;
  }
}
