import { normalizeAndValidateEmployeeEmail } from './internal-user-email.validator';
import { ImportRowValidationException } from '../exceptions/import-row-validation.exception';

describe('normalizeAndValidateEmployeeEmail', () => {
  it('normalizes valid email', () => {
    expect(normalizeAndValidateEmployeeEmail('  User@Example.COM  ')).toBe(
      'user@example.com',
    );
  });

  it('rejects empty email when required', () => {
    expect(() => normalizeAndValidateEmployeeEmail('', true)).toThrow(
      ImportRowValidationException,
    );
    try {
      normalizeAndValidateEmployeeEmail('', true);
    } catch (error) {
      expect(error).toMatchObject({ errorCode: 'EMPLOYEE_EMAIL_REQUIRED' });
    }
  });

  it('rejects invalid email format', () => {
    expect(() => normalizeAndValidateEmployeeEmail('test', true)).toThrow(
      ImportRowValidationException,
    );
    try {
      normalizeAndValidateEmployeeEmail('test', true);
    } catch (error) {
      expect(error).toMatchObject({
        errorCode: 'EMPLOYEE_INVALID_EMAIL',
        params: { email: 'test' },
      });
    }
  });

  it('rejects email without TLD', () => {
    expect(() => normalizeAndValidateEmployeeEmail('a@b', true)).toThrow(
      ImportRowValidationException,
    );
  });
});
