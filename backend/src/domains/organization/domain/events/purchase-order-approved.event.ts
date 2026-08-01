import { DomainEvent } from '@/shared/domain/domain-event';
import { PurchaseOrderItemProps } from '../value-objects/purchase-order-item.vo';

export class PurchaseOrderApprovedEvent implements DomainEvent {
  public readonly eventName: string;
  public readonly occurredOn: Date;
  public readonly payload: Record<string, unknown>;

  constructor(params: {
    supplierId: string;
    orderId: string;
    items: PurchaseOrderItemProps[];
  }) {
    this.eventName = 'PurchaseOrderApproved';
    this.occurredOn = new Date();
    this.payload = {
      supplierId: params.supplierId,
      orderId: params.orderId,
      items: params.items,
    };
  }
}
