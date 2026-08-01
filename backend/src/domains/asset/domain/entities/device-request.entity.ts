import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { DeviceRequestStatusEnum, DeviceRequestStatusEnumType } from '@/shared/domain/enums/device.enum';
import { DeviceRequestItemVo, DeviceRequestItemProps } from '../value-objects/device-request-item.vo';
import { DeviceRequestDeviceVo, DeviceRequestDeviceProps } from '../value-objects/device-request-device.vo';

export interface DeviceRequestProps {
  type: string;
  status: DeviceRequestStatusEnumType;
  userId: string;
  user?: any;
  requestedByUser?: any;
  approvedByUser?: any;
  requestedByUserId: string;
  reason: string;
  approvedByUserId?: string;
  approvedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  items: DeviceRequestItemVo[];
  replacementDevices: DeviceRequestDeviceVo[];
}

export class DeviceRequestEntity extends AggregateRoot<DeviceRequestProps> {
  get type(): string {
    return this.props.type;
  }

  get status(): DeviceRequestStatusEnumType {
    return this.props.status;
  }

  get userId(): string {
    return this.props.userId;
  }

  get requestedByUserId(): string {
    return this.props.requestedByUserId;
  }

  get user(): any {
    return this.props.user;
  }

  get requestedByUser(): any {
    return this.props.requestedByUser;
  }

  get approvedByUser(): any {
    return this.props.approvedByUser;
  }

  get reason(): string {
    return this.props.reason;
  }

  get approvedByUserId(): string | undefined {
    return this.props.approvedByUserId;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get items(): DeviceRequestItemVo[] {
    return this.props.items;
  }

  get replacementDevices(): DeviceRequestDeviceVo[] {
    return this.props.replacementDevices;
  }

  private constructor(id: string, props: DeviceRequestProps) {
    super(id, props);
  }

  public approve(approvedBy: string): void {
    if (this.props.status !== DeviceRequestStatusEnum.PENDING) {
      throw new Error(`Cannot approve request in status "${this.props.status}"`);
    }

    this.props.status = DeviceRequestStatusEnum.APPROVED;
    this.props.approvedByUserId = approvedBy;
    this.props.approvedAt = new Date();
  }

  public reject(rejectedBy: string): void {
    if (this.props.status !== DeviceRequestStatusEnum.PENDING) {
      throw new Error(`Cannot reject request in status "${this.props.status}"`);
    }

    this.props.status = DeviceRequestStatusEnum.REJECTED;
    this.props.approvedByUserId = rejectedBy;
  }

  public complete(): void {
    if (this.props.status !== DeviceRequestStatusEnum.APPROVED) {
      throw new Error(`Cannot complete request in status "${this.props.status}"`);
    }

    this.props.status = DeviceRequestStatusEnum.COMPLETED;
    this.props.completedAt = new Date();
  }

  public cancel(): void {
    const cancellableStatuses: DeviceRequestStatusEnumType[] = [
      DeviceRequestStatusEnum.PENDING,
      DeviceRequestStatusEnum.APPROVED,
    ];

    if (!cancellableStatuses.includes(this.props.status)) {
      throw new Error(`Cannot cancel request in status "${this.props.status}"`);
    }

    this.props.status = DeviceRequestStatusEnum.CANCELLED;
  }

  public updateFields(fields: Partial<Pick<DeviceRequestProps, 'type' | 'reason' | 'items' | 'replacementDevices'>>): void {
    const allowedFields = ['type', 'reason', 'items', 'replacementDevices'] as const;

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        (this.props as unknown as Record<string, unknown>)[field] = fields[field];
      }
    }
  }

  public toPlainObject(): Record<string, unknown> {
     return {
      id: this._id,
      type: this.props.type,
      status: this.props.status,

      userId: this.props.userId,
      user: this.props.user,

      requestedByUserId: this.props.requestedByUserId,
      requestedByUser: this.props.requestedByUser,

      approvedByUserId: this.props.approvedByUserId,
      approvedByUser: this.props.approvedByUser,

      reason: this.props.reason,
      approvedAt: this.props.approvedAt,
      completedAt: this.props.completedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,

      items: this.props.items.map((item) => item.toPlainObject()),

      replacementDevices: this.props.replacementDevices.map((d) =>
        d.toPlainObject(),
      ),
    };
  }

  public static create(id: string, props: DeviceRequestProps): DeviceRequestEntity {
    return new DeviceRequestEntity(id, props);
  }
}
