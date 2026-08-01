import { ExecutionContext } from '@nestjs/common';
import { IPolicyHandler, RequestUser } from './policy-handler.interface';

export class DepartmentOwnershipPolicy implements IPolicyHandler {
  canAccess(user: RequestUser, context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const targetDeptId = req.params.departmentId ?? req.body.departmentId;
    return user.departmentId === targetDeptId;
  }
}
