import { DomainException } from './domain.exception';

export class DuplicateDepartmentCodeException extends DomainException {
  constructor(code: string) {
    super(`Department with code "${code}" already exists`, 409, 'DUPLICATE_DEPARTMENT_CODE', {
      code,
    });
  }
}
