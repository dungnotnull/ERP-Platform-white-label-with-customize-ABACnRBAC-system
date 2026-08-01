import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICY_KEY } from '../decorators/check-policy.decorator';
import { IPolicyHandler, RequestUser } from '../policies/policy-handler.interface';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.get<IPolicyHandler>(POLICY_KEY, context.getHandler());
    if (!policy) return true;

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) return false;
    if (user.isSuperadmin) return true;

    return policy.canAccess(user, context);
  }
}
