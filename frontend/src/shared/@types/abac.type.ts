export interface PolicyCondition {
  field: string; // e.g. 'resource.departmentId', 'resource.createdBy', 'user.id'
  operator:
    | "equals"
    | "notEquals"
    | "in"
    | "notIn"
    | "contains"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "exists";
  value: any;
  valueType: "static" | "template"; // 'template' resolves patterns like {{user.departmentId}}
}

export interface AbacPolicy {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  roleIds: string[]; // empty array means applicable to all roles
  resource: string; // e.g. 'device', 'supplier', 'user'
  action: string; // 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'import'
  effect: "allow" | "deny";
  conditions: PolicyCondition[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
