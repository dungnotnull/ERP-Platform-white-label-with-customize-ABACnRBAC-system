import { canApprove } from './purchase-order-approval.policy';
import { PurchaseOrderItemProps } from '../value-objects/purchase-order-item.vo';

describe('canApprovePurchaseOrder', () => {
  const makeItem = (overrides?: Partial<PurchaseOrderItemProps>): PurchaseOrderItemProps => ({
    deviceTypeId: 'type-laptop',
    deviceName: 'ThinkPad X1',
    quantity: 2,
    unitPrice: 1500,
    ...overrides,
  });

  it('should return true for status "draft" with non-empty items', () => {
    const order = {
      status: 'draft',
      items: [makeItem()],
    };

    expect(canApprove(order)).toBe(true);
  });

  it('should return false when status is "approved"', () => {
    const order = {
      status: 'approved',
      items: [makeItem()],
    };

    expect(canApprove(order)).toBe(false);
  });

  it('should return false when status is not "draft"', () => {
    const order = {
      status: 'pending',
      items: [makeItem()],
    };

    expect(canApprove(order)).toBe(true);
  });

  it('should return false for empty items array', () => {
    const order = {
      status: 'draft',
      items: [],
    };

    expect(canApprove(order)).toBe(false);
  });

  it('should return false when items is null or undefined', () => {
    expect(canApprove({ status: 'draft', items: null as unknown as PurchaseOrderItemProps[] })).toBe(false);
    expect(canApprove({ status: 'draft', items: undefined as unknown as PurchaseOrderItemProps[] })).toBe(false);
  });

  it('should return false when status is "approved" even with items', () => {
    const order = {
      status: 'approved',
      items: [makeItem(), makeItem({ deviceTypeId: 'type-monitor' })],
    };

    expect(canApprove(order)).toBe(false);
  });
});
