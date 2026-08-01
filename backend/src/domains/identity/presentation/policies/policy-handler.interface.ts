import { ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  departmentId: string;
  isSuperadmin: boolean;
  permVersion: number;
  bitmap: Buffer;
  roleIds?: string[];
}

export interface IPolicyHandler {
  canAccess(user: RequestUser, context: ExecutionContext): boolean | Promise<boolean>;
}
