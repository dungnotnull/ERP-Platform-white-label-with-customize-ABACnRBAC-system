export interface Permission {
  _id: string;
  name: string;
  status?: string;
  description?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface EndpointPermission {
  id: string;
  method: string;
  pathPattern: string;
  module: string;
  permission: string;
  bitIndex: number;
  isActive: boolean;
  description?: string;
}

export interface EndpointPermissionsResponse {
  items: EndpointPermission[];
  total: number;
  page: number;
  limit: number;
}

export interface RoleOutput {
  id: string;
  name: string;
  description?: string;
  endpointPermissionIds: string[];
  departmentIds: string[];
  isSystem: boolean;
  status: string;
}

export interface RolesResponse {
  items: RoleOutput[];
  total: number;
  page: number;
  limit: number;
}

export interface ModuleOutput {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

export interface DiscoveredRoute {
  method: string;
  path: string;
  module: string;
  isAssigned: boolean;
}

export interface DepartmentOutput {
  id: string;
  nameVi: string;
  nameJa: string;
  name?: string;
  code: string;
}
