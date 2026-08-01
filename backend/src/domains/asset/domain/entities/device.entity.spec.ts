import { DeviceEntity, DeviceProps } from './device.entity';
import { TransactionTypeEnum } from '@/shared/domain/enums/device.enum';
import { DeviceAssignmentVo } from '../value-objects/device-assignment.vo';
import { DeviceMaintenanceVo } from '../value-objects/device-maintenance.vo';

describe('DeviceEntity', () => {
  const makeProps = (overrides?: Partial<DeviceProps>): DeviceProps => ({
    name: 'Laptop X1',
    serialNumber: 'SN-001',
    model: 'ThinkPad X1',
    manufacturer: 'Lenovo',
    deviceTypeId: 'type-laptop',
    deviceStatusId: 'status-active',
    notes: 'Primary developer laptop',
    isDeleted: false,
    currentAssignment: null,
    assignmentHistory: [],
    maintenanceRecords: [],
    transactions: [],
    ...overrides,
  });

  describe('create()', () => {
    it('should create entity with correct props', () => {
      const props = makeProps();
      const device = DeviceEntity.create('device-1', props);

      expect(device.id).toBe('device-1');
      expect(device.name).toBe('Laptop X1');
      expect(device.serialNumber).toBe('SN-001');
      expect(device.model).toBe('ThinkPad X1');
      expect(device.manufacturer).toBe('Lenovo');
      expect(device.isDeleted).toBe(false);
      expect(device.currentAssignment).toBeNull();
    });
  });

  describe('assignTo()', () => {
    it('should set currentAssignment and add ASSIGNMENT transaction', () => {
      const device = DeviceEntity.create('device-1', makeProps());
      device.clearDomainEvents();

      device.assignTo('user-1', 'Alice', 'admin-1');

      expect(device.currentAssignment).not.toBeNull();
      expect(device.currentAssignment!.userId).toBe('user-1');
      expect(device.currentAssignment!.userName).toBe('Alice');
      expect(device.currentAssignment!.assignedBy).toBe('admin-1');

      expect(device.transactions).toHaveLength(1);
      expect(device.transactions[0].transactionType).toBe(TransactionTypeEnum.ASSIGNMENT);
      expect(device.transactions[0].userId).toBe('user-1');
      expect(device.transactions[0].performedBy).toBe('admin-1');

      expect(device.domainEvents).toHaveLength(1);
      expect(device.domainEvents[0].eventName).toBe('device.assigned');
    });

    it('should throw when device is already assigned', () => {
      const device = DeviceEntity.create('device-1', makeProps());
      device.assignTo('user-1', 'Alice', 'admin-1');

      expect(() => device.assignTo('user-2', 'Bob', 'admin-1')).toThrow(
        'Device "device-1" is already assigned',
      );
    });
  });

  describe('returnDevice()', () => {
    it('should move assignment to history, clear current, and add RETURN transaction', () => {
      const device = DeviceEntity.create('device-1', makeProps());
      device.assignTo('user-1', 'Alice', 'admin-1');
      device.clearDomainEvents();

      device.returnDevice('admin-1');

      expect(device.currentAssignment).toBeNull();
      expect(device.assignmentHistory).toHaveLength(1);
      expect(device.assignmentHistory[0].userId).toBe('user-1');
      expect(device.assignmentHistory[0].userName).toBe('Alice');
      expect(device.assignmentHistory[0].returnedBy).toBe('admin-1');

      const returnTransaction = device.transactions.find(
        (t) => t.transactionType === TransactionTypeEnum.RETURN,
      );
      expect(returnTransaction).toBeDefined();
      expect(returnTransaction!.performedBy).toBe('admin-1');

      expect(device.domainEvents).toHaveLength(1);
      expect(device.domainEvents[0].eventName).toBe('device.returned');
    });

    it('should throw when device is not assigned', () => {
      const device = DeviceEntity.create('device-1', makeProps());

      expect(() => device.returnDevice('admin-1')).toThrow(
        'Device "device-1" is not currently assigned',
      );
    });
  });

  describe('markAsDeleted()', () => {
    it('should set isDeleted to true and add DISPOSAL transaction', () => {
      const device = DeviceEntity.create('device-1', makeProps());

      device.markAsDeleted();

      expect(device.isDeleted).toBe(true);

      expect(device.transactions).toHaveLength(1);
      expect(device.transactions[0].transactionType).toBe(TransactionTypeEnum.DISPOSAL);
      expect(device.transactions[0].notes).toBe('Device marked as deleted');
    });
  });

  describe('addMaintenance()', () => {
    it('should add record to maintenanceRecords', () => {
      const device = DeviceEntity.create('device-1', makeProps());
      const record = new DeviceMaintenanceVo({
        maintenanceType: 'repair',
        status: 'scheduled',
        scheduledDate: new Date(),
        description: 'Screen replacement',
      });

      device.addMaintenance(record);

      expect(device.maintenanceRecords).toHaveLength(1);
      expect(device.maintenanceRecords[0].maintenanceType).toBe('repair');
      expect(device.maintenanceRecords[0].description).toBe('Screen replacement');

      const maintenanceTransaction = device.transactions.find(
        (t) => t.transactionType === TransactionTypeEnum.MAINTENANCE,
      );
      expect(maintenanceTransaction).toBeDefined();
    });
  });

  describe('toPlainObject()', () => {
    it('should return all props as a plain object', () => {
      const props = makeProps();
      const device = DeviceEntity.create('device-1', props);

      const plain = device.toPlainObject();

      expect(plain.id).toBe('device-1');
      expect(plain.name).toBe('Laptop X1');
      expect(plain.serialNumber).toBe('SN-001');
      expect(plain.model).toBe('ThinkPad X1');
      expect(plain.manufacturer).toBe('Lenovo');
      expect(plain.deviceTypeId).toBe('type-laptop');
      expect(plain.deviceStatusId).toBe('status-active');
      expect(plain.notes).toBe('Primary developer laptop');
      expect(plain.isDeleted).toBe(false);
      expect(plain.currentAssignment).toBeNull();
      expect(plain.assignmentHistory).toEqual([]);
      expect(plain.maintenanceRecords).toEqual([]);
      expect(plain.transactions).toEqual([]);
    });
  });
});
