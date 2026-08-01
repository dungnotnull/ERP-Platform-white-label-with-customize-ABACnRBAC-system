import { DeviceRequestEntity, DeviceRequestProps } from './device-request.entity';
import { DeviceRequestStatusEnum } from '@/shared/domain/enums/device.enum';
import { DeviceRequestItemVo } from '../value-objects/device-request-item.vo';
import { DeviceRequestDeviceVo } from '../value-objects/device-request-device.vo';

describe('DeviceRequestEntity', () => {
  const makeProps = (overrides?: Partial<DeviceRequestProps>): DeviceRequestProps => ({
    type: 'NEW_ASSIGNMENT',
    status: DeviceRequestStatusEnum.PENDING,
    userId: 'user-1',
    requestedByUserId: 'requester-1',
    reason: 'New employee needs a laptop',
    items: [new DeviceRequestItemVo({ deviceTypeId: 'type-laptop', quantity: 1 })],
    replacementDevices: [],
    ...overrides,
  });

  describe('create()', () => {
    it('should create entity with correct props', () => {
      const props = makeProps();
      const request = DeviceRequestEntity.create('req-1', props);

      expect(request.id).toBe('req-1');
      expect(request.type).toBe('NEW_ASSIGNMENT');
      expect(request.status).toBe(DeviceRequestStatusEnum.PENDING);
      expect(request.userId).toBe('user-1');
      expect(request.requestedByUserId).toBe('requester-1');
      expect(request.reason).toBe('New employee needs a laptop');
      expect(request.items).toHaveLength(1);
    });
  });

  describe('approve()', () => {
    it('should set status to APPROVED, approvedByUserId, and approvedAt', () => {
      const request = DeviceRequestEntity.create('req-1', makeProps());
      const before = new Date();

      request.approve('admin-1');

      const after = new Date();
      expect(request.status).toBe(DeviceRequestStatusEnum.APPROVED);
      expect(request.approvedByUserId).toBe('admin-1');
      expect(request.approvedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(request.approvedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw when status is not PENDING', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.APPROVED }),
      );

      expect(() => request.approve('admin-1')).toThrow(
        'Cannot approve request in status "APPROVED"',
      );
    });

    it('should throw when status is REJECTED', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.REJECTED }),
      );

      expect(() => request.approve('admin-1')).toThrow(
        'Cannot approve request in status "REJECTED"',
      );
    });
  });

  describe('reject()', () => {
    it('should set status to REJECTED when currently PENDING', () => {
      const request = DeviceRequestEntity.create('req-1', makeProps());

      request.reject('admin-1');

      expect(request.status).toBe(DeviceRequestStatusEnum.REJECTED);
      expect(request.approvedByUserId).toBe('admin-1');
    });

    it('should throw when status is not PENDING', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.APPROVED }),
      );

      expect(() => request.reject('admin-1')).toThrow(
        'Cannot reject request in status "APPROVED"',
      );
    });
  });

  describe('complete()', () => {
    it('should set status to COMPLETED when currently APPROVED', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.APPROVED }),
      );
      const before = new Date();

      request.complete();

      const after = new Date();
      expect(request.status).toBe(DeviceRequestStatusEnum.COMPLETED);
      expect(request.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(request.completedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw when status is PENDING', () => {
      const request = DeviceRequestEntity.create('req-1', makeProps());

      expect(() => request.complete()).toThrow(
        'Cannot complete request in status "PENDING"',
      );
    });
  });

  describe('cancel()', () => {
    it('should set status to CANCELLED when currently PENDING', () => {
      const request = DeviceRequestEntity.create('req-1', makeProps());

      request.cancel();

      expect(request.status).toBe(DeviceRequestStatusEnum.CANCELLED);
    });

    it('should set status to CANCELLED when currently APPROVED', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.APPROVED }),
      );

      request.cancel();

      expect(request.status).toBe(DeviceRequestStatusEnum.CANCELLED);
    });

    it('should throw when status is REJECTED', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.REJECTED }),
      );

      expect(() => request.cancel()).toThrow(
        'Cannot cancel request in status "REJECTED"',
      );
    });

    it('should throw when status is COMPLETED', () => {
      const request = DeviceRequestEntity.create(
        'req-1',
        makeProps({ status: DeviceRequestStatusEnum.COMPLETED }),
      );

      expect(() => request.cancel()).toThrow(
        'Cannot cancel request in status "COMPLETED"',
      );
    });
  });
});
