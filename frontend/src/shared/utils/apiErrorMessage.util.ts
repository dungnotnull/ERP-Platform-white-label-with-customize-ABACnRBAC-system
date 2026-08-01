import type { TFunction } from "i18next";

export interface ApiErrorPayload {
  message?: string;
  errorCode?: string;
  params?: Record<string, string>;
}

const API_ERROR_KEYS: Record<string, string> = {
  // Employees
  EMPLOYEE_DUPLICATE_EMAIL: "employees.errors.duplicateEmail",
  EMPLOYEE_DUPLICATE_EMPLOYEE_CODE: "employees.errors.duplicateEmployeeCode",
  EMPLOYEE_CODE_USED_BY: "employees.errors.employeeCodeUsedBy",
  DUPLICATE_DATA: "employees.errors.duplicateData",
  IMPORT_ROW_FAILED: "employees.errors.importRowFailed",
  IMPORT_DEPARTMENT_NOT_FOUND: "employees.errors.importDepartmentNotFound",
  IMPORT_DEPARTMENT_REQUIRED: "employees.errors.importDepartmentRequired",
  IMPORT_MISSING_REQUIRED_FIELDS:
    "employees.errors.importMissingRequiredFields",
  IMPORT_POSITION_NOT_FOUND: "employees.errors.importPositionNotFound",
  IMPORT_POSITION_REQUIRED: "employees.errors.importPositionRequired",
  EMPLOYEE_NAME_TOO_LONG: "employees.errors.nameMaxLength",
  EMPLOYEE_NAME_REQUIRED: "employees.errors.nameRequired",
  EMPLOYEE_EMAIL_REQUIRED: "employees.errors.emailRequired",
  EMPLOYEE_INVALID_EMAIL: "employees.errors.invalidEmail",
  EMPLOYEE_CODE_REQUIRED: "employees.errors.employeeCodeRequired",
  IMPORT_CSV_MISSING_COLUMNS: "employees.import.errors.missingColumns",
  IMPORT_CSV_EMPTY: "employees.import.errors.csvEmpty",
  IMPORT_CSV_PARSE_ERROR: "assets.import.errors.csvParseError",
  IMPORT_DATA_REQUIRED: "employees.import.errors.dataRequired",
  IMPORT_CSV_OR_ROWS_REQUIRED: "assets.import.errors.dataRequired",
  IMPORT_DEVICE_MISSING_REQUIRED_FIELDS:
    "assets.import.errors.missingRequiredFields",
  IMPORT_DEVICE_INVALID_PURCHASE_DATE:
    "assets.import.errors.invalidPurchaseDate",
  IMPORT_DEVICE_INVALID_WARRANTY_DATE:
    "assets.import.errors.invalidWarrantyDate",
  INTERNAL_USER_NOT_FOUND: "employees.errors.notFound",
  DEPARTMENT_NOT_FOUND: "employees.errors.departmentNotFound",
  POSITION_NOT_FOUND: "employees.errors.positionNotFound",
  USER_ID_REQUIRED: "employees.errors.userIdRequired",
  VALIDATION_FAILED: "employees.errors.validationFailed",
  SAVE_FAILED: "employees.errors.saveFailed",
  OPERATION_FAILED: "common.errors.operationFailed",
  INTERNAL_USER_HAS_DEVICES: "employees.delete.hasDevices",

  // Teams / departments
  DEPARTMENT_HAS_USERS: "teams.deleteDepartment.hasUsers",
  DUPLICATE_DEPARTMENT_CODE: "teams.errors.duplicateDepartmentCode",
  DUPLICATE_POSITION_NAME: "teams.errors.duplicatePositionName",

  // Assets / devices
  DEVICE_NOT_FOUND: "assets.errors.notFound",
  DEVICE_NOT_ASSIGNABLE: "assets.errors.notAssignable",
  DEVICE_NOT_RETURNABLE: "assets.errors.notReturnable",
  DEVICE_ALREADY_ASSIGNED: "assets.errors.alreadyAssigned",
  DEVICE_DELETE_ASSIGNED: "assets.errors.deleteAssigned",
  DEVICE_DUPLICATE_SERIAL: "assets.errors.duplicateSerial",
  DEVICE_STATUS_INVALID: "assets.errors.statusInvalid",
  DEVICE_STATUS_HANDED_OVER_ONLY_ASSIGN:
    "assets.errors.statusHandedOverOnlyAssign",
  DEVICE_STATUS_MUST_RETURN_FIRST: "assets.errors.statusMustReturnFirst",

  // Suppliers
  SUPPLIER_NOT_FOUND: "supplier.errors.notFound",

  // Meeting bookings
  ROOM_CONFLICT: "meetingPages.form.errors.roomConflict",
  INVALID_TIME_RANGE: "meetingPages.form.errors.endTimeAfterStart",
  DUPLICATE_BOOKING_TITLE: "meetingPages.form.errors.titleDuplicate",
  BOOKING_ALREADY_DELETED: "meetingPages.form.errors.alreadyDeleted",
  BOOKING_NOT_FOUND: "meetingPages.form.errors.alreadyDeleted",
  BOOKING_CONCURRENT_MODIFICATION: "meetingPages.form.errors.concurrentModification",
  BOOKING_QUEUE_FULL: "meetingPages.form.errors.queueFull"
};

export function extractApiErrorPayload(error: unknown): ApiErrorPayload | null {
  const data = (error as { response?: { data?: ApiErrorPayload } })?.response
    ?.data;

  if (!data) {
    return null;
  }

  return {
    message: data.message,
    errorCode: data.errorCode,
    params: data.params
  };
}

const SUPPLIER_ERROR_KEY_OVERRIDES: Record<string, string> = {
  VALIDATION_FAILED: "supplier.errors.validationFailed"
};

export function resolveApiErrorMessage(
  error: unknown,
  t: TFunction,
  fallbackKey = "common.errors.operationFailed",
  errorKeyOverrides?: Record<string, string>
): string {
  const payload = extractApiErrorPayload(error);

  if (payload?.errorCode) {
    const key =
      errorKeyOverrides?.[payload.errorCode] ??
      API_ERROR_KEYS[payload.errorCode];
    if (key) {
      return t(key, payload.params ?? {});
    }
  }

  if (payload?.message?.trim()) {
    return payload.message;
  }

  return t(fallbackKey);
}

export function resolveSupplierApiErrorMessage(
  error: unknown,
  t: TFunction,
  fallbackKey = "supplier.errors.saveFailed"
): string {
  return resolveApiErrorMessage(
    error,
    t,
    fallbackKey,
    SUPPLIER_ERROR_KEY_OVERRIDES
  );
}
