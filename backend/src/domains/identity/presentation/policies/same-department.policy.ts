import { ExecutionContext } from '@nestjs/common';
import { IPolicyHandler, RequestUser } from './policy-handler.interface';

export class SameDepartmentPolicy implements IPolicyHandler {
  canAccess(user: RequestUser, context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const resource = req._resource;
    return resource?.departmentId?.toString() === user.departmentId;
  }
}
