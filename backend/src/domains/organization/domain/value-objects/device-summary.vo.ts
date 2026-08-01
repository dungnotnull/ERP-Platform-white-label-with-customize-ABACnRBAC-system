import { ValueObject } from '@/shared/domain/value-object.base';

export interface DeviceSummaryProps {
  total: number;
  activeAssignments: number;
}

export class DeviceSummaryVo extends ValueObject<DeviceSummaryProps> {
  get total(): number {
    return this.props.total;
  }

  get activeAssignments(): number {
    return this.props.activeAssignments;
  }
}
