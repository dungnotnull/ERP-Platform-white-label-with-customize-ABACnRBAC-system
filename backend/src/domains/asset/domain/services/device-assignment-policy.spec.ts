import { DeviceAssignmentPolicy } from './device-assignment-policy';
import { DeviceAlreadyAssignedException } from '../exceptions/device-already-assigned.exception';
import { DeviceNotAssignableException } from '../exceptions/device-not-assignable.exception';
import { DeviceNotReturnableException } from '../exceptions/device-not-returnable.exception';

describe('DeviceAssignmentPolicy', () => {
  let policy: DeviceAssignmentPolicy;

  beforeEach(() => {
    policy = new DeviceAssignmentPolicy();
  });

  describe('canAssign()', () => {
    it('should return true when currentAssignment is null', () => {
      expect(policy.canAssign({ currentAssignment: null })).toBe(true);
    });

    it('should return false when currentAssignment exists', () => {
      expect(policy.canAssign({ currentAssignment: { userId: 'user-1' } })).toBe(false);
    });
  });

  describe('validateAssignment()', () => {
    it('should not throw when device has no current assignment', () => {
      expect(() =>
        policy.validateAssignment({ currentAssignment: null, id: 'device-1' }),
      ).not.toThrow();
    });

    it('should throw DeviceAlreadyAssignedException when device is assigned', () => {
      expect(() =>
        policy.validateAssignment({ currentAssignment: { userId: 'user-1' }, id: 'device-1' }),
      ).toThrow(DeviceAlreadyAssignedException);
    });

    it('should include device id in the exception message', () => {
      expect(() =>
        policy.validateAssignment({ currentAssignment: { userId: 'user-1' }, id: 'device-42' }),
      ).toThrow('Device "device-42" is already assigned to a user');
    });
  });

  describe('validateAssignable()', () => {
    it('should not throw for usable unassigned device', () => {
      expect(() =>
        policy.validateAssignable(
          { currentAssignment: null, id: 'device-1' },
          'usable',
        ),
      ).not.toThrow();
    });

    it('should throw when status is not usable', () => {
      expect(() =>
        policy.validateAssignable(
          { currentAssignment: null, id: 'device-1' },
          'handed_over',
        ),
      ).toThrow(DeviceNotAssignableException);
    });

    it('should throw when device is already assigned', () => {
      expect(() =>
        policy.validateAssignable(
          { currentAssignment: { userId: 'user-1' }, id: 'device-1' },
          'usable',
        ),
      ).toThrow(DeviceAlreadyAssignedException);
    });
  });

  describe('validateReturnable()', () => {
    it('should not throw for handed_over assigned device', () => {
      expect(() =>
        policy.validateReturnable(
          { currentAssignment: { userId: 'user-1' }, id: 'device-1' },
          'handed_over',
        ),
      ).not.toThrow();
    });

    it('should throw when status is not handed_over', () => {
      expect(() =>
        policy.validateReturnable(
          { currentAssignment: { userId: 'user-1' }, id: 'device-1' },
          'usable',
        ),
      ).toThrow(DeviceNotReturnableException);
    });

    it('should throw when device has no current assignment', () => {
      expect(() =>
        policy.validateReturnable(
          { currentAssignment: null, id: 'device-1' },
          'handed_over',
        ),
      ).toThrow(DeviceNotReturnableException);
    });
  });
});
