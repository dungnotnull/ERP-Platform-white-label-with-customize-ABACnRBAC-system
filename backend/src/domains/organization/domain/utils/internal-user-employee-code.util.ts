export function buildReleasedEmployeeCode(
  userId: string,
  employeeCode: string,
): string {
  return `__DELETED__${userId}__${employeeCode.trim().toUpperCase()}`;
}

export function isReleasedEmployeeCode(employeeCode: string): boolean {
  return employeeCode.startsWith('__DELETED__');
}
