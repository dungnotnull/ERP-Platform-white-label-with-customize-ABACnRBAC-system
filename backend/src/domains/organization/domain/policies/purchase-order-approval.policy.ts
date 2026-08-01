import { PurchaseOrderItemProps } from '../value-objects/purchase-order-item.vo';

export function canApprove(order: {
  status: string;
  items: PurchaseOrderItemProps[];
}): boolean {
  if (order.status === 'approved') {
    return false;
  }
  if (!order.items || order.items.length === 0) {
    return false;
  }
  return true;
}
