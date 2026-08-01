export interface DepartmentOverviewEmployee {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  position: {
    id: string;
    nameVi: string;
    nameJa: string;
    level: number | null;
  } | null;
  isActive: boolean;
  role: string;
}

export interface DepartmentOverviewItem {
  id: string;
  code: string;
  nameVi: string;
  nameJa: string;
  description: string;
  employeeCount: number;
  employees: DepartmentOverviewEmployee[];
}
