import { InternalUserEntity, InternalUserProps } from './internal-user.entity';

describe('InternalUserEntity', () => {
  const makeProps = (overrides?: Partial<InternalUserProps>): InternalUserProps => ({
    name: 'Alice Smith',
    email: 'alice@company.com',
    employeeCode: 'EMP-001',
    departmentId: 'dept-eng',
    positionId: 'pos-dev',
    isActive: true,
    isDeleted: false,
    role: 'employee',
    deviceSummary: { total: 2, activeAssignments: 1 },
    ...overrides,
  });

  describe('constructor / create', () => {
    it('should create entity with correct props', () => {
      const props = makeProps();
      const user = new InternalUserEntity('user-1', props);

      expect(user.id).toBe('user-1');
      expect(user.name).toBe('Alice Smith');
      expect(user.email).toBe('alice@company.com');
      expect(user.employeeCode).toBe('EMP-001');
      expect(user.departmentId).toBe('dept-eng');
      expect(user.positionId).toBe('pos-dev');
      expect(user.isActive).toBe(true);
      expect(user.role).toBe('employee');
      expect(user.deviceSummary).toEqual({ total: 2, activeAssignments: 1 });
    });
  });

  describe('deactivate()', () => {
    it('should set isActive to false without soft delete', () => {
      const user = new InternalUserEntity('user-1', makeProps());

      user.deactivate();

      expect(user.isActive).toBe(false);
      expect(user.isDeleted).toBe(false);
    });
  });

  describe('softDelete()', () => {
    it('should set isDeleted to true, keep isActive, and release employeeCode', () => {
      const user = new InternalUserEntity('user-1', makeProps({ isActive: true }));

      user.softDelete();

      expect(user.isDeleted).toBe(true);
      expect(user.isActive).toBe(true);
      expect(user.employeeCode).toBe('__DELETED__user-1__EMP-001');
    });
  });

  describe('updateDepartmentAndPosition()', () => {
    it('should update department and position IDs', () => {
      const user = new InternalUserEntity('user-1', makeProps());

      user.updateDepartmentAndPosition('dept-qa', 'pos-lead');

      expect(user.departmentId).toBe('dept-qa');
      expect(user.positionId).toBe('pos-lead');
    });
  });

  describe('updateDeviceSummary()', () => {
    it('should update the deviceSummary', () => {
      const user = new InternalUserEntity('user-1', makeProps());
      const newSummary = { total: 5, activeAssignments: 3 };

      user.updateDeviceSummary(newSummary);

      expect(user.deviceSummary).toEqual({ total: 5, activeAssignments: 3 });
    });
  });

  describe('toPlainObject()', () => {
    it('should return all props as a plain object', () => {
      const user = new InternalUserEntity('user-1', makeProps());

      const plain = user.toPlainObject();

      expect(plain).toEqual({
        id: 'user-1',
        name: 'Alice Smith',
        email: 'alice@company.com',
        employeeCode: 'EMP-001',
        departmentId: 'dept-eng',
        positionId: 'pos-dev',
        isActive: true,
        isDeleted: false,
        role: 'employee',
        deviceSummary: { total: 2, activeAssignments: 1 },
      });
    });
  });
});
