export interface LocalizedOrganizationNameOutput {
  nameVi: string;
  nameJa: string;
}

export interface CreateDepartmentInput {
  code: string;
  nameVi: string;
  nameJa?: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  id: string;
  nameVi?: string;
  nameJa?: string;
  description?: string;
}

export interface DepartmentOutput extends LocalizedOrganizationNameOutput {
  id: string;
  code: string;
  description: string;
}

export interface PaginatedDepartmentsOutput {
  items: DepartmentOutput[];
  total: number;
  page: number;
  limit: number;
}

export interface DepartmentOverviewEmployeeOutput {
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

export interface DepartmentOverviewOutput extends LocalizedOrganizationNameOutput {
  id: string;
  code: string;
  description: string;
  employeeCount: number;
  employees: DepartmentOverviewEmployeeOutput[];
}

export interface DepartmentsOverviewOutput {
  items: DepartmentOverviewOutput[];
  total: number;
}

export interface DepartmentDeviceTypeStatOutput {
  deviceTypeName: string;
  totalAssignedDevices: number;
}

export interface DepartmentDevicesStatOutput extends LocalizedOrganizationNameOutput {
  departmentId: string;
  total: number;
  deviceTypes: DepartmentDeviceTypeStatOutput[];
}

export interface DevicesByDepartmentOutput {
  items: DepartmentDevicesStatOutput[];
}
