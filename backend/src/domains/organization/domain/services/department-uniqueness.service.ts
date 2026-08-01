import { DuplicateDepartmentCodeException } from '../exceptions/duplicate-department-code.exception';

export function validateDepartmentCode(code: string, existingCodes: string[]): void {
  const upperCode = code.toUpperCase();
  const hasMatch = existingCodes.some(
    (existing) => existing.toUpperCase() === upperCode,
  );
  if (hasMatch) {
    throw new DuplicateDepartmentCodeException(code);
  }
}
