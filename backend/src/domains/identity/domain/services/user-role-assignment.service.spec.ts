import { UserRoleAssignmentService } from './user-role-assignment.service';

describe('UserRoleAssignmentService', () => {
  let service: UserRoleAssignmentService;

  beforeEach(() => {
    service = new UserRoleAssignmentService();
  });

  describe('validateRoleAssignment()', () => {
    it('should pass when all roleIds are in available list', () => {
      expect(() =>
        service.validateRoleAssignment(['role-1', 'role-2'], ['role-1', 'role-2', 'role-3']),
      ).not.toThrow();
    });

    it('should throw on empty roleIds array', () => {
      expect(() => service.validateRoleAssignment([], ['role-1'])).toThrow(
        'At least one role is required for assignment',
      );
    });

    it('should throw when roleId is not in available list', () => {
      expect(() =>
        service.validateRoleAssignment(['role-1', 'role-999'], ['role-1', 'role-2']),
      ).toThrow('Invalid role id: "role-999"');
    });

    it('should throw when roleIds is null or undefined', () => {
      expect(() =>
        service.validateRoleAssignment(null as unknown as string[], ['role-1']),
      ).toThrow('At least one role is required for assignment');

      expect(() =>
        service.validateRoleAssignment(undefined as unknown as string[], ['role-1']),
      ).toThrow('At least one role is required for assignment');
    });
  });

  describe('getDefaultRoleIds()', () => {
    it('should return an empty array by default', () => {
      expect(service.getDefaultRoleIds()).toEqual([]);
    });
  });
});
