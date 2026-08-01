import { DomainException } from './domain.exception';

export class DuplicateInternalUserEmailException extends DomainException {
  constructor(email: string) {
    super(
      `Email "${email}" đã tồn tại trong hệ thống`,
      409,
      'EMPLOYEE_DUPLICATE_EMAIL',
      { email },
    );
  }
}
