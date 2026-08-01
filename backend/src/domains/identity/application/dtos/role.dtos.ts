export interface CreateRoleInput {
  name: string;
  description?: string;
  departmentIds: string[];
  endpointPermissionIds: string[];
}

export interface UpdateRoleInput {
  id: string;
  name?: string;
  description?: string;
  endpointPermissionIds?: string[];
  departmentIds?: string[];
  status?: string;
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
