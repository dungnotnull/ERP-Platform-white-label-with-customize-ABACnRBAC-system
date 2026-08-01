export interface CreatePermissionInput {
  name: string;
  description?: string;
  createdBy?: string;
}

export interface UpdatePermissionInput {
  id: string;
  name?: string;
  description?: string;
  updatedBy?: string;
}

export interface PermissionOutput {
  id: string;
  name: string;
  description?: string;
  status: string;
}
