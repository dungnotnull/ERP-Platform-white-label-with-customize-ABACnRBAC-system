import { DomainException } from './domain.exception';

export class PermissionNotFoundException extends DomainException {
  constructor(permissionId: string) {
    super(`Permission with id "${permissionId}" not found`, 404);
  }
}
