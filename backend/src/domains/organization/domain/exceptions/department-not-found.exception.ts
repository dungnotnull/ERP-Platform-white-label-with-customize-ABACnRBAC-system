import { DomainException } from './domain.exception';

export class DepartmentNotFoundException extends DomainException {
  constructor(departmentId: string) {
    super(
      `Department with id "${departmentId}" not found`,
      404,
      'DEPARTMENT_NOT_FOUND',
      { id: departmentId },
    );
  }
}
