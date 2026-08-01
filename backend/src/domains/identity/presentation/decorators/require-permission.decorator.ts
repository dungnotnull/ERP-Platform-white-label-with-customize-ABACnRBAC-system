import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

export interface PermissionMetadata {
  module: string;
  permission: string;
}

export const RequirePermission = (module: string, permission: string) =>
  SetMetadata(PERMISSION_KEY, { module, permission });
