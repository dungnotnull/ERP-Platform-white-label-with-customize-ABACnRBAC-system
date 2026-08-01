import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { RoleStatusEnumType } from '@/shared/domain/enums/role.enum';

export interface RoleProps {
  name: string;
  displayName?: string;
  description?: string;
  endpointPermissionIds: string[];
  isSystem: boolean;
  isActive: boolean;
  status: RoleStatusEnumType;
  departmentIds: string[];
}

export class RoleEntity extends AggregateRoot<RoleProps> {
  get name(): string {
    return this.props.name;
  }

  get displayName(): string | undefined {
    return this.props.displayName;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get endpointPermissionIds(): string[] {
    return this.props.endpointPermissionIds;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get status(): RoleStatusEnumType {
    return this.props.status;
  }

  get departmentIds(): string[] {
    return this.props.departmentIds;
  }

  constructor(id: string, props: RoleProps) {
    super(id, props);
  }

  public hasEndpointPermission(id: string): boolean {
    return this.props.endpointPermissionIds.includes(id);
  }

  public updateEndpointPermissions(ids: string[]): void {
    this.props.endpointPermissionIds = ids;
  }
}
