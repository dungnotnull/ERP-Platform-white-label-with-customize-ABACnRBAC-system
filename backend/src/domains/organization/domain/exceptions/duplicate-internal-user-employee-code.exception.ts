import { DomainException } from './domain.exception';

export class DuplicateInternalUserEmployeeCodeException extends DomainException {
  constructor(employeeCode: string) {
    super(
      `Mã nhân viên "${employeeCode}" đã tồn tại trong hệ thống`,
      409,
      'EMPLOYEE_DUPLICATE_EMPLOYEE_CODE',
      { employeeCode },
    );
  }
}

export class DuplicateInternalUserEmployeeCodeInUseException extends DomainException {
  constructor(employeeCode: string, ownerName: string, ownerEmail: string) {
    super(
      `Mã nhân viên "${employeeCode}" đã được sử dụng bởi ${ownerName} (${ownerEmail})`,
      409,
      'EMPLOYEE_CODE_USED_BY',
      { employeeCode, name: ownerName, email: ownerEmail },
    );
  }
}
