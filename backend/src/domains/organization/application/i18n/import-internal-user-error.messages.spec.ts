import {
  hasInternalUserErrorMessage,
  resolveInternalUserErrorMessage,
} from './import-internal-user-error.messages';

describe('hasInternalUserErrorMessage', () => {
  it('returns true for known codes', () => {
    expect(hasInternalUserErrorMessage('EMPLOYEE_EMAIL_REQUIRED')).toBe(true);
  });

  it('returns false for unknown codes', () => {
    expect(hasInternalUserErrorMessage('DUPLICATE_POSITION_NAME')).toBe(false);
  });
});

describe('resolveInternalUserErrorMessage', () => {
  it('returns Vietnamese message by default locale', () => {
    expect(
      resolveInternalUserErrorMessage(
        'EMPLOYEE_EMAIL_REQUIRED',
        undefined,
        'vi',
      ),
    ).toBe('Vui lòng nhập email nhân viên');
  });

  it('returns Japanese message for ja locale', () => {
    expect(
      resolveInternalUserErrorMessage(
        'EMPLOYEE_EMAIL_REQUIRED',
        undefined,
        'ja',
      ),
    ).toBe('メールアドレスを入力してください');
  });

  it('interpolates params', () => {
    expect(
      resolveInternalUserErrorMessage(
        'IMPORT_DEPARTMENT_NOT_FOUND',
        { department: 'IT' },
        'vi',
      ),
    ).toBe('Phòng ban "IT" không tồn tại trong hệ thống');
  });

  it('returns localized CSV missing columns message', () => {
    expect(
      resolveInternalUserErrorMessage(
        'IMPORT_CSV_MISSING_COLUMNS',
        { columns: 'email, employeeCode' },
        'ja',
      ),
    ).toBe('CSV形式が無効です。不足している列: email, employeeCode');
  });

  it('returns localized delete has devices message', () => {
    expect(
      resolveInternalUserErrorMessage(
        'INTERNAL_USER_HAS_DEVICES',
        { count: '2' },
        'ja',
      ),
    ).toBe(
      '削除できません：2台のデバイスが割り当てられています。先にデバイスを返却してください。',
    );
  });
});
