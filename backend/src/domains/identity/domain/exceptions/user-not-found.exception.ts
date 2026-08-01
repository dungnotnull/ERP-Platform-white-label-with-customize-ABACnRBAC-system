import { DomainException } from './domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(userId: string) {
    super(`User with id "${userId}" not found`, 404);
  }
}
