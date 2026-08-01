import { ValueObject } from '@/shared/domain/value-object.base';

export interface DeviceMaintenanceProps {
  maintenanceType: string;
  status: string;
  scheduledDate: Date;
  cost?: number;
  description?: string;
}

export class DeviceMaintenanceVo extends ValueObject<DeviceMaintenanceProps> {
  get maintenanceType(): string {
    return this.props.maintenanceType;
  }

  get status(): string {
    return this.props.status;
  }

  get scheduledDate(): Date {
    return this.props.scheduledDate;
  }

  get cost(): number | undefined {
    return this.props.cost;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  toPlainObject(): DeviceMaintenanceProps {
    return {
      maintenanceType: this.props.maintenanceType,
      status: this.props.status,
      scheduledDate: this.props.scheduledDate,
      ...(this.props.cost !== undefined && { cost: this.props.cost }),
      ...(this.props.description !== undefined && { description: this.props.description }),
    };
  }
}
