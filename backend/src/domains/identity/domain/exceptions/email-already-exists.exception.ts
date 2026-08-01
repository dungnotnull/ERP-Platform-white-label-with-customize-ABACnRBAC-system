import { DomainException } from './domain.exception';

export class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`Email "${email}" is already registered`, 409);
  }
}
