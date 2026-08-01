import type { AppLocale } from '@/shared/infrastructure/i18n/parse-request-locale';

type MessageTemplate = (params: Record<string, string>) => string;

const MESSAGES: Record<string, Record<AppLocale, MessageTemplate>> = {
  EMPLOYEE_EMAIL_REQUIRED: {
    vi: () => 'Vui lòng nhập email nhân viên',
    ja: () => 'メールアドレスを入力してください',
  },
  EMPLOYEE_INVALID_EMAIL: {
    vi: ({ email }) => `Email "${email}" không hợp lệ`,
    ja: ({ email }) => `メールアドレス「${email}」は無効です`,
  },
  EMPLOYEE_NAME_REQUIRED: {
    vi: () => 'Vui lòng nhập tên nhân viên',
    ja: () => '従業員名を入力してください',
  },
  EMPLOYEE_NAME_TOO_LONG: {
    vi: ({ max }) => `Tên không được quá ${max} ký tự`,
    ja: ({ max }) => `名前は${max}文字以内で入力してください`,
  },
  EMPLOYEE_CODE_REQUIRED: {
    vi: () => 'Vui lòng nhập mã nhân viên',
    ja: () => '従業員コードを入力してください',
  },
  EMPLOYEE_DUPLICATE_EMAIL: {
    vi: ({ email }) => `Email "${email}" đã tồn tại trong hệ thống`,
    ja: ({ email }) => `メールアドレス「${email}」は既に登録されています`,
  },
  EMPLOYEE_DUPLICATE_EMPLOYEE_CODE: {
    vi: ({ employeeCode }) =>
      `Mã nhân viên "${employeeCode}" đã tồn tại trong hệ thống`,
    ja: ({ employeeCode }) =>
      `従業員コード「${employeeCode}」は既に使用されています`,
  },
  EMPLOYEE_CODE_USED_BY: {
    vi: ({ employeeCode, name, email }) =>
      `Mã nhân viên "${employeeCode}" đã được sử dụng bởi ${name} (${email})`,
    ja: ({ employeeCode, name, email }) =>
      `従業員コード「${employeeCode}」は ${name}（${email}）が使用中です`,
  },
  DUPLICATE_DATA: {
    vi: () => 'Dữ liệu đã tồn tại trong hệ thống',
    ja: () => 'データが既に存在します',
  },
  DUPLICATE_DEPARTMENT_CODE: {
    vi: ({ code }) => `Mã phòng ban "${code}" đã tồn tại trong hệ thống`,
    ja: ({ code }) => `部門コード「${code}」は既に使用されています`,
  },
  DUPLICATE_POSITION_NAME: {
    vi: ({ name }) => `Tên chức vụ "${name}" đã tồn tại trong hệ thống`,
    ja: ({ name }) => `役職名「${name}」は既に使用されています`,
  },
  IMPORT_DEPARTMENT_NOT_FOUND: {
    vi: ({ department }) =>
      `Phòng ban "${department}" không tồn tại trong hệ thống`,
    ja: ({ department }) =>
      `部門「${department}」はシステムに存在しません`,
  },
  IMPORT_DEPARTMENT_REQUIRED: {
    vi: () => 'Thiếu mã hoặc tên phòng ban trong file CSV',
    ja: () => 'CSVに部門コードまたは部門名がありません',
  },
  IMPORT_MISSING_REQUIRED_FIELDS: {
    vi: ({ fields }) => {
      const labels: Record<string, string> = {
        department: 'phòng ban (department)',
        position: 'chức vụ (position)',
        isActive: 'trạng thái (isActive)',
      };
      const list = fields
        .split(',')
        .map((field) => labels[field.trim()] ?? field.trim())
        .join(', ');
      return `Sai dữ liệu bắt buộc trong file CSV: ${list}`;
    },
    ja: ({ fields }) => {
      const labels: Record<string, string> = {
        department: '部門 (department)',
        position: '役職 (position)',
        isActive: 'ステータス (isActive)',
      };
      const list = fields
        .split(',')
        .map((field) => labels[field.trim()] ?? field.trim())
        .join(', ');
      return `CSVの必須データが正しくありません: ${list}`;
    },
  },
  IMPORT_POSITION_NOT_FOUND: {
    vi: ({ position }) =>
      `Chức vụ "${position}" không tồn tại trong hệ thống`,
    ja: ({ position }) =>
      `役職「${position}」はシステムに存在しません`,
  },
  IMPORT_POSITION_REQUIRED: {
    vi: () => 'Thiếu level hoặc tên chức vụ trong file CSV',
    ja: () => 'CSVに役職レベルまたは役職名がありません',
  },
  IMPORT_ROW_FAILED: {
    vi: ({ details }) =>
      details?.trim() || 'Import dòng này thất bại',
    ja: ({ details }) =>
      details?.trim() || 'この行のインポートに失敗しました',
  },
  IMPORT_DEVICE_MISSING_REQUIRED_FIELDS: {
    vi: ({ rowNumber }) =>
      `Dòng ${rowNumber}: Thiếu số serial hoặc tên thiết bị`,
    ja: ({ rowNumber }) =>
      `行 ${rowNumber}: シリアル番号またはデバイス名がありません`,
  },
  IMPORT_DEVICE_INVALID_PURCHASE_DATE: {
    vi: ({ rowNumber }) => `Dòng ${rowNumber}: Ngày mua không hợp lệ`,
    ja: ({ rowNumber }) => `行 ${rowNumber}: 購入日が無効です`,
  },
  IMPORT_DEVICE_INVALID_WARRANTY_DATE: {
    vi: ({ rowNumber }) =>
      `Dòng ${rowNumber}: Ngày hết hạn bảo hành không hợp lệ`,
    ja: ({ rowNumber }) => `行 ${rowNumber}: 保証期限が無効です`,
  },
  IMPORT_CSV_MISSING_COLUMNS: {
    vi: ({ columns }) =>
      `Định dạng CSV không hợp lệ. Thiếu cột: ${columns}`,
    ja: ({ columns }) =>
      `CSV形式が無効です。不足している列: ${columns}`,
  },
  IMPORT_CSV_EMPTY: {
    vi: () => 'File CSV trống',
    ja: () => 'CSVファイルが空です',
  },
  IMPORT_CSV_PARSE_ERROR: {
    vi: () => 'Không thể đọc file CSV',
    ja: () => 'CSVファイルを読み込めません',
  },
  IMPORT_DATA_REQUIRED: {
    vi: () => 'Dữ liệu import là bắt buộc',
    ja: () => 'インポートデータが必要です',
  },
  IMPORT_CSV_OR_ROWS_REQUIRED: {
    vi: () => 'Cần file CSV hoặc dữ liệu dòng import',
    ja: () => 'CSVファイルまたはインポート行データが必要です',
  },
  INTERNAL_USER_NOT_FOUND: {
    vi: () => 'Không tìm thấy nhân viên',
    ja: () => '従業員が見つかりません',
  },
  DEPARTMENT_NOT_FOUND: {
    vi: () => 'Không tìm thấy phòng ban',
    ja: () => '部門が見つかりません',
  },
  POSITION_NOT_FOUND: {
    vi: () => 'Không tìm thấy chức vụ',
    ja: () => '役職が見つかりません',
  },
  DEPARTMENT_HAS_USERS: {
    vi: ({ count }) =>
      `Không thể xóa phòng ban: còn ${count} nhân viên. Vui lòng chuyển hoặc xóa nhân viên trước.`,
    ja: ({ count }) =>
      `削除できません：この部門に${count}名の従業員が所属しています。先に従業員を移動または削除してください。`,
  },
  INTERNAL_USER_HAS_DEVICES: {
    vi: ({ count }) =>
      `Không thể xóa nhân viên: còn ${count} thiết bị đang được gán. Vui lòng thu hồi thiết bị trước.`,
    ja: ({ count }) =>
      `削除できません：${count}台のデバイスが割り当てられています。先にデバイスを返却してください。`,
  },
  SUPPLIER_NOT_FOUND: {
    vi: () => 'Không tìm thấy nhà cung cấp',
    ja: () => '仕入先が見つかりません',
  },
  DEVICE_NOT_FOUND: {
    vi: () => 'Không tìm thấy thiết bị',
    ja: () => 'デバイスが見つかりません',
  },
  DEVICE_NOT_ASSIGNABLE: {
    vi: () => 'Thiết bị không thể bàn giao ở trạng thái hiện tại',
    ja: () => '現在の状態ではデバイスを割り当てできません',
  },
  DEVICE_NOT_RETURNABLE: {
    vi: () => 'Thiết bị không thể thu hồi ở trạng thái hiện tại',
    ja: () => '現在の状態ではデバイスを返却できません',
  },
  DEVICE_ALREADY_ASSIGNED: {
    vi: () => 'Thiết bị đã được bàn giao cho nhân viên khác',
    ja: () => 'デバイスは既に別の従業員に割り当てられています',
  },
  DEVICE_DELETE_ASSIGNED: {
    vi: () => 'Không thể xóa thiết bị đang được bàn giao cho nhân viên',
    ja: () => '割り当て中のデバイスは削除できません',
  },
  DEVICE_DUPLICATE_SERIAL: {
    vi: ({ serialNumber }) =>
      `Số serial "${serialNumber}" đã tồn tại trong hệ thống`,
    ja: ({ serialNumber }) =>
      `シリアル番号「${serialNumber}」は既に登録されています`,
  },
  DEVICE_STATUS_INVALID: {
    vi: () => 'Trạng thái thiết bị không hợp lệ',
    ja: () => 'デバイスのステータスが無効です',
  },
  DEVICE_STATUS_HANDED_OVER_ONLY_ASSIGN: {
    vi: () =>
      'Trạng thái "Đã bàn giao" chỉ được cập nhật thông qua chức năng bàn giao thiết bị',
    ja: () =>
      '「引き渡し済み」ステータスはデバイス割り当て機能でのみ更新できます',
  },
  DEVICE_STATUS_MUST_RETURN_FIRST: {
    vi: () =>
      'Thiết bị đang được bàn giao. Vui lòng thu hồi trước khi đổi trạng thái',
    ja: () =>
      'デバイスは割り当て中です。ステータスを変更する前に返却してください',
  },
  USER_ID_REQUIRED: {
    vi: () => 'userId là bắt buộc',
    ja: () => 'userIdは必須です',
  },
  VALIDATION_FAILED: {
    vi: () => 'Dữ liệu không hợp lệ',
    ja: () => '入力データが無効です',
  },
  SAVE_FAILED: {
    vi: () => 'Lỗi khi lưu dữ liệu',
    ja: () => 'データの保存に失敗しました',
  },
  ROOM_CONFLICT: {
    vi: () =>
      'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn phòng hoặc thời gian khác.',
    ja: () =>
      'この時間帯は会議室が既に予約されています。別の会議室または時間を選択してください。',
  },
  INVALID_TIME_RANGE: {
    vi: () => 'Giờ kết thúc phải sau giờ bắt đầu.',
    ja: () => '終了時刻は開始時刻より後にしてください。',
  },
  DUPLICATE_BOOKING_TITLE: {
    vi: () => 'Tiêu đề đã tồn tại. Vui lòng nhập tiêu đề khác.',
    ja: () => 'タイトルは既に存在します。別のタイトルを入力してください。',
  },
  BOOKING_ALREADY_DELETED: {
    vi: () => 'Lịch đặt phòng họp này đã được xóa rồi.',
    ja: () => 'この会議室予約は既に削除されています。',
  },
  BOOKING_NOT_FOUND: {
    vi: () => 'Lịch đặt phòng họp này đã được xóa rồi.',
    ja: () => 'この会議室予約は既に削除されています。',
  },
  OPERATION_FAILED: {
    vi: () => 'Thao tác thất bại',
    ja: () => '操作に失敗しました',
  },
};

export function hasApiErrorMessage(errorCode: string): boolean {
  return errorCode in MESSAGES;
}

/** @deprecated Use hasApiErrorMessage */
export const hasInternalUserErrorMessage = hasApiErrorMessage;

export function resolveApiErrorMessage(
  errorCode: string | undefined,
  params: Record<string, string> | undefined,
  locale: AppLocale,
): string {
  const code = errorCode ?? 'OPERATION_FAILED';
  const template = MESSAGES[code]?.[locale] ?? MESSAGES[code]?.vi;

  if (template) {
    return template(params ?? {});
  }

  return MESSAGES.OPERATION_FAILED[locale]({});
}

/** @deprecated Use resolveApiErrorMessage from shared catalog */
export const resolveInternalUserErrorMessage = resolveApiErrorMessage;

/** @deprecated Use resolveApiErrorMessage */
export const resolveImportErrorMessage = resolveApiErrorMessage;

export function buildLocalizedErrorPayload(
  errorCode: string,
  params: Record<string, string>,
  locale: AppLocale,
): { message: string; errorCode: string; params: Record<string, string> } {
  return {
    message: resolveApiErrorMessage(errorCode, params, locale),
    errorCode,
    params,
  };
}
