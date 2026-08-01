import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESOURCE_ACTION_KEY, ResourceActionMetadata } from '../decorators/resource-action.decorator';
import { AbacRuleEngineService } from '@/domains/identity/application/services/abac-rule-engine.service';
import { UserPermCacheService } from '@/domains/identity/application/services/user-perm-cache.service';
import { RequestUser } from '../policies/policy-handler.interface';

@Injectable()
export class DynamicPolicyGuard implements CanActivate {
  private readonly logger = new Logger(DynamicPolicyGuard.name);

  constructor(
    private reflector: Reflector,
    private ruleEngine: AbacRuleEngineService,
    private permCacheService: UserPermCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<ResourceActionMetadata>(
      RESOURCE_ACTION_KEY,
      context.getHandler(),
    );

    if (!meta) return true;

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) return false;

    const { isSuperadmin } = await this.permCacheService.resolvePermissions(
      user.userId,
      user.permVersion,
      user.bitmap,
      user.isSuperadmin,
    );

    if (isSuperadmin) return true;

    const resource = request._resource ?? null;
    if (!resource) {
      this.logger.debug(
        `No resource loaded for ${meta.resource}:${meta.action} on ${request.method} ${request.path}`,
      );
    }

    const allowed = await this.ruleEngine.evaluateResourceAccess(
      user,
      meta.resource,
      meta.action,
      resource,
    );

    if (!allowed) {
      this.logger.warn(
        `ABAC denied: user ${user.userId} cannot ${meta.action} ${meta.resource} ${
          resource?._id || resource?.id || ''
        }`,
      );
    }

    return allowed;
  }
}
