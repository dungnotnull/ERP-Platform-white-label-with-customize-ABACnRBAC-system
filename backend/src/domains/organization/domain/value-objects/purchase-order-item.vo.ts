import { ValueObject } from '@/shared/domain/value-object.base';

export interface PurchaseOrderItemProps {
  deviceTypeId: string;
  deviceName: string;
  quantity: number;
  unitPrice: number;
}

export class PurchaseOrderItemVo extends ValueObject<PurchaseOrderItemProps> {
  get deviceTypeId(): string {
    return this.props.deviceTypeId;
  }

  get deviceName(): string {
    return this.props.deviceName;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }
}
