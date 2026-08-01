import { ValueObject } from '@/shared/domain/value-object.base';

export interface DeviceRequestItemProps {
  deviceType?: any;
  deviceTypeId: string;
  quantity: number;
}

export class DeviceRequestItemVo extends ValueObject<DeviceRequestItemProps> {
  get deviceTypeId(): string {
    return this.props.deviceTypeId;
  }

  get deviceType(): any {
    return this.props.deviceType;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  toPlainObject(): DeviceRequestItemProps {
    return {
      deviceTypeId: this.props.deviceTypeId,
      quantity: this.props.quantity,
      deviceType: this.props.deviceType,
    };
  }
}
