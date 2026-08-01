/** @deprecated Replaced by ABAC system. Do not use in new code. */
import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@/shared/domain/enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
