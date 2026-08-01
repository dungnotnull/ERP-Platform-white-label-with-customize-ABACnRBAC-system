import { ExecutionContext } from '@nestjs/common';
import { IPolicyHandler, RequestUser } from './policy-handler.interface';

export class OwnerOnlyPolicy implements IPolicyHandler {
  canAccess(user: RequestUser, context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const resource = req._resource;
    return resource?.createdBy?.toString() === user.userId;
  }
}
