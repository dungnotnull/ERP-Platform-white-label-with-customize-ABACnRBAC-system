/** @deprecated Replaced by ABAC system. Do not use in new code. */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Roles } from '@/shared/domain/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      this.logger.warn('Unauthenticated user attempted to access protected resource');
      return false;
    }

    if (user.role === Roles.SUPERADMIN) return true;

    if (
      requiredPermissions &&
      (!Array.isArray(user.permissions) ||
        !requiredPermissions.every((p: string) => user.permissions.includes(p)))
    ) {
      this.logger.warn(
        `User ${user._id || user.sub} lacks required permissions: ${requiredPermissions.join(', ')}`,
      );
      return false;
    }

    if (requiredRoles) {
      const hasRole = requiredRoles.some(
        (role: string) =>
          user.role === role || (user.roles && user.roles.includes(role)),
      );

      if (!hasRole) {
        this.logger.warn(
          `User ${user._id || user.sub} lacks required role: ${requiredRoles.join(', ')}`,
        );
        return false;
      }
    }

    return true;
  }
}
