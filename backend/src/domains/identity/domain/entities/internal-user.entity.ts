// internal-user.entity.ts

import { AggregateRoot } from '@/shared/domain/aggregate-root';

export interface DeviceSummaryProps {
  total: number;
  activeAssignments: number;
}

export interface InternalUserProps {
  name: string;
  email: string;
  employeeCode: string;
  departmentId?: string;
  positionId?: string;
  isActive: boolean;
  role: string;
  isDeleted: boolean;
  deviceSummary: DeviceSummaryProps;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InternalUserEntity extends AggregateRoot<InternalUserProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get employeeCode(): string {
    return this.props.employeeCode;
  }

  get departmentId(): string | undefined {
    return this.props.departmentId;
  }

  get positionId(): string | undefined {
    return this.props.positionId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get role(): string {
    return this.props.role;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get deviceSummary(): DeviceSummaryProps {
    return this.props.deviceSummary;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private constructor(id: string, props: InternalUserProps) {
    super(id, props);
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      ...this.props,
    };
  }

  public static create(
    id: string,
    props: InternalUserProps,
  ): InternalUserEntity {
    return new InternalUserEntity(id, props);
  }
}