import { DomainException } from './domain.exception';

export class InternalUserNotFoundException extends DomainException {
  constructor(userId: string) {
    super(
      `Internal user with id "${userId}" not found`,
      404,
      'INTERNAL_USER_NOT_FOUND',
      { id: userId },
    );
  }
}
