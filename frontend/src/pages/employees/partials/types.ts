export interface Department {
  id: string;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  code?: string;
}

export interface Position {
  id: string;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  level?: number | null;
}

export interface DeviceSummary {
  total: number;
  activeAssignments: number;
}

export interface InternalUser {
  id?: string;
  name: string;
  email: string;
  employeeCode?: string | null;
  department?: Department | null;
  position?: Position | null;
  role?: string | null;
  isActive: boolean;
  deviceSummary?: DeviceSummary;
}
