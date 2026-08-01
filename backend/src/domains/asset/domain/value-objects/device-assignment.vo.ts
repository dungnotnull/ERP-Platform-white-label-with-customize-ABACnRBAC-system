import { ValueObject } from '@/shared/domain/value-object.base';

export interface DeviceAssignmentProps {
  userId: string;
  userName: string;
  assignedAt: Date;
  assignedBy: string;
  returnedAt?: Date | null;
  returnedBy?: string | null;
}

export interface AssignmentHistoryItemProps extends DeviceAssignmentProps {
  returnedAt: Date | null;
  returnedBy: string | null;
}

export class DeviceAssignmentVo extends ValueObject<DeviceAssignmentProps> {
  get userId(): string {
    return this.props.userId;
  }

  get userName(): string {
    return this.props.userName;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get assignedBy(): string {
    return this.props.assignedBy;
  }

  get returnedAt(): Date | null {
    return this.props.returnedAt ?? null;
  }

  get returnedBy(): string | null {
    return this.props.returnedBy ?? null;
  }

  toPlainObject(): DeviceAssignmentProps {
    return {
      userId: this.props.userId,
      userName: this.props.userName,
      assignedAt: this.props.assignedAt,
      assignedBy: this.props.assignedBy,
      returnedAt: this.props.returnedAt,
      returnedBy: this.props.returnedBy,
    };
  }
}
