export interface InternalUserQueryPort {
  findDepartmentCodeByEmail(email: string): Promise<string | null>;
}
