import { ImportRowValidationException } from '@/domains/organization/domain/exceptions/import-row-validation.exception';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function normalizeAndValidateEmployeeEmail(
  email: string | undefined,
  required = true,
): string {
  const trimmed = email?.trim().toLowerCase() ?? '';

  if (!trimmed) {
    if (required) {
      throw new ImportRowValidationException(
        'Email is required',
        'EMPLOYEE_EMAIL_REQUIRED',
      );
    }
    return '';
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ImportRowValidationException(
      `Invalid email format: "${trimmed}"`,
      'EMPLOYEE_INVALID_EMAIL',
      { email: trimmed },
    );
  }

  return trimmed;
}
