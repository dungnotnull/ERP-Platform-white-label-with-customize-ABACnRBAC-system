import { DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';

export interface DeviceSummaryOutput {
  total: number;
  activeAssignments: number;
}

export interface CreateInternalUserInput {
  name: string;
  email: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateInternalUserInput {
  id: string;
  name?: string;
  email?: string;
  employeeCode?: string;
  departmentId?: string;
  positionId?: string;
  role?: string;
  isActive?: boolean;
}

export interface DepartmentRefOutput {
  id: string;
  code: string;
  nameVi: string;
  nameJa: string;
}

export interface PositionRefOutput {
  id: string;
  nameVi: string;
  nameJa: string;
  level?: number | null;
}

export interface InternalUserOutput {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  department?: DepartmentRefOutput | null;
  position?: PositionRefOutput | null;
  isActive: boolean;
  role: string;
  deviceSummary: DeviceSummaryOutput;
  assignedDevices?: DeviceOutput[];
}

export interface PaginatedInternalUsersOutput {
  items: InternalUserOutput[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}
