export interface DepartmentDetails {
  id: string;
  nameVi: string;
  nameJa: string;
}

export interface DepartmentQueryPort {
  findById(id: string): Promise<DepartmentDetails | null>;
  findByIds(ids: string[]): Promise<DepartmentDetails[]>;
}
