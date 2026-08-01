import { DomainException } from './domain.exception';

export class DepartmentHasUsersException extends DomainException {
  constructor(count: number) {
    super(
      `Cannot delete department: ${count} employee(s) are still assigned to this department`,
      409,
      'DEPARTMENT_HAS_USERS',
      { count: String(count) },
    );
  }
}
