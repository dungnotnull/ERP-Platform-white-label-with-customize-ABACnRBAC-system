/** @deprecated Replaced by ABAC system. Do not use in new code. */
import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '@/shared/domain/enums/role.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
