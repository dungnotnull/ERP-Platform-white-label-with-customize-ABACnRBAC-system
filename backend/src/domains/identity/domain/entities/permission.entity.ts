import { Entity } from '@/shared/domain/entity.base';
import { PermissionStatusEnumType } from '@/shared/domain/enums/role.enum';

export interface PermissionProps {
  name: string;
  description?: string;
  status: PermissionStatusEnumType;
  createdBy?: string;
  updatedBy?: string;
}

export class PermissionEntity extends Entity<PermissionProps> {
  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): PermissionStatusEnumType {
    return this.props.status;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  constructor(id: string, props: PermissionProps) {
    super(id, props);
  }

  public softDelete(deletedBy: string): void {
    this.props.status = 'DELETED' as PermissionStatusEnumType;
    this.props.updatedBy = deletedBy;
  }

  public restore(): void {
    this.props.status = 'ACTIVE' as PermissionStatusEnumType;
  }

  public update(props: Partial<Pick<PermissionProps, 'name' | 'description' | 'updatedBy'>>): void {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }
    if (props.description !== undefined) {
      this.props.description = props.description;
    }
    if (props.updatedBy !== undefined) {
      this.props.updatedBy = props.updatedBy;
    }
  }
}
