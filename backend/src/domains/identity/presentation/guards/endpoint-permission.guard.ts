/** @deprecated Replaced by ABAC system. Do not use in new code. */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_ENDPOINT_PERMISSION_KEY } from '../decorators/skip-endpoint-permission.decorator';
import { Roles } from '@/shared/domain/enums/role.enum';

@Injectable()
export class EndpointPermissionGuard implements CanActivate {
  private readonly logger = new Logger(EndpointPermissionGuard.name);

  private cachedRules: {
    method: string;
    pathPattern: string;
    requiredPermissions: string[];
    effect: string;
  }[] = [];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipEndpointPermission =
      this.reflector.getAllAndOverride<boolean>(
        SKIP_ENDPOINT_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );
    if (skipEndpointPermission) return true;

    const http = context.switchToHttp();
    const req = http.getRequest();
    const user = req.user;
    const method = req.method;
    const path = req.path ?? req.url ?? '';

    if (!user) return true;

    if (user.role === Roles.SUPERADMIN) return true;

    const match = this.match(method, path);
    if (!match) {
      this.logger.warn(
        `EndpointPermissionGuard: no permission rule for ${method} ${path} -> deny by default`,
      );
      return false;
    }

    const required = match.requiredPermissions;
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];

    const hasAll = required.every((p: string) => userPerms.includes(p));
    if (!hasAll) {
      this.logger.warn(
        `EndpointPermissionGuard: user ${user._id || user.sub} lacks permission(s): ${required.join(', ')} for ${method} ${path}`,
      );
      return false;
    }

    return true;
  }

  match(
    method: string,
    path: string,
  ): { requiredPermissions: string[] } | null {
    for (const rule of this.cachedRules) {
      if (rule.method !== method) continue;

      const normalizedPattern = rule.pathPattern.replace(/^\//, '');
      const normalizedPath = path.replace(/^\/api\/?/, '').replace(/^\//, '');

      if (normalizedPattern === normalizedPath) {
        return { requiredPermissions: rule.requiredPermissions };
      }
    }
    return null;
  }

  loadRules(
    rules: {
      method: string;
      pathPattern: string;
      requiredPermissions: string[];
      effect: string;
    }[],
  ): void {
    this.cachedRules = rules;
  }

  constructor(private readonly reflector: Reflector) {}
}
