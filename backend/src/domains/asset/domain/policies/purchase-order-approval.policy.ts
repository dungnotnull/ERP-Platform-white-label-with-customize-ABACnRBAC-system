export function canApprovePurchaseOrder(order: {
  status: string;
  items: unknown[];
}): boolean {
  return order.status === 'draft' && order.items.length > 0;
}
