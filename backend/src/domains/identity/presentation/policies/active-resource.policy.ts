import { ExecutionContext } from '@nestjs/common';
import { IPolicyHandler, RequestUser } from './policy-handler.interface';

export class ActiveResourcePolicy implements IPolicyHandler {
  canAccess(user: RequestUser, context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const resource = req._resource;
    return resource?.isActive !== false && !resource?.deletedAt;
  }
}
