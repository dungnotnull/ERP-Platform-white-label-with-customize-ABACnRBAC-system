export interface CreateEndpointPermissionInput {
  method: string;
  pathPattern: string;
  module: string;
  permission: string;
  description?: string;
}

export interface UpdateEndpointPermissionInput {
  id: string;
  method?: string;
  pathPattern?: string;
  module?: string;
  permission?: string;
  description?: string;
}

export interface EndpointPermissionOutput {
  id: string;
  method: string;
  pathPattern: string;
  module: string;
  permission: string;
  bitIndex: number;
  pathRegex?: string;
  isActive: boolean;
  description?: string;
}
