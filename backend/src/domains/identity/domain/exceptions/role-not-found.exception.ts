import { DomainException } from './domain.exception';

export class RoleNotFoundException extends DomainException {
  constructor(roleId: string) {
    super(`Role with id "${roleId}" not found`, 404);
  }
}
