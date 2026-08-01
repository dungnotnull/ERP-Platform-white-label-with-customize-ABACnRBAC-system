import { ValueObject } from '@/shared/domain/value-object.base';

export interface DeviceRequestDeviceProps {
  oldDeviceId: string;
  newDeviceId: string;
}

export class DeviceRequestDeviceVo extends ValueObject<DeviceRequestDeviceProps> {
  get oldDeviceId(): string {
    return this.props.oldDeviceId;
  }

  get newDeviceId(): string {
    return this.props.newDeviceId;
  }

  toPlainObject(): DeviceRequestDeviceProps {
    return {
      oldDeviceId: this.props.oldDeviceId,
      newDeviceId: this.props.newDeviceId,
    };
  }
}
