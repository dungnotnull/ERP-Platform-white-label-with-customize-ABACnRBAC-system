export interface InternalUserDetails {
  id: string;
  name: string;
  email: string;
  departmentId: string;
}

export interface InternalUserQueryPort {
  findById(id: string): Promise<InternalUserDetails | null>;
  findByEmail(email: string): Promise<InternalUserDetails | null>;
  findByIds(ids: string[]): Promise<InternalUserDetails[]>;
  findByDepartmentId(departmentId: string, search?: string): Promise<InternalUserDetails[]>;
  findActivePaginated(input: {
    search?: string;
    departmentId?: string;
    page: number;
    limit: number;
  }): Promise<{
    items: InternalUserDetails[];
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  }>;
}
