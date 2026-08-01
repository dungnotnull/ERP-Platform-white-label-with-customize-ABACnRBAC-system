import { UserEntity, UserProps } from './user.entity';
import { UserStatusEnum } from '@/shared/domain/enums/user.enum';

describe('UserEntity', () => {
  const makeProps = (overrides?: Partial<UserProps>): UserProps => ({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    status: UserStatusEnum.ACTIVE,
    roleIds: ['role-1'],
    permVersion: 1,
    isSuperadmin: false,
    departmentIds: [],
    onBoardingCompleted: false,
    ...overrides,
  });

  describe('create()', () => {
    it('should create entity with correct props', () => {
      const props = makeProps();
      const user = UserEntity.create('user-1', props);

      expect(user.id).toBe('user-1');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.password).toBe('hashed-password');
      expect(user.status).toBe(UserStatusEnum.ACTIVE);
      expect(user.roleIds).toEqual(['role-1']);
      expect(user.onBoardingCompleted).toBe(false);
    });

    it('should add a UserRegisteredEvent on creation', () => {
      const user = UserEntity.create('user-1', makeProps());

      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0].eventName).toBe('user.registered');
      expect(user.domainEvents[0].payload).toEqual({
        userId: 'user-1',
        email: 'john@example.com',
      });
    });
  });

  describe('assignRoles()', () => {
    it('should assign new roleIds', () => {
      const user = UserEntity.create('user-1', makeProps());
      user.clearDomainEvents();

      user.assignRoles(['role-2', 'role-3']);

      expect(user.roleIds).toEqual(['role-2', 'role-3']);
    });

    it('should throw on empty array', () => {
      const user = UserEntity.create('user-1', makeProps());

      expect(() => user.assignRoles([])).toThrow('At least one role is required');
    });

    it('should throw when passed null or undefined', () => {
      const user = UserEntity.create('user-1', makeProps());

      expect(() => user.assignRoles(null as unknown as string[])).toThrow(
        'At least one role is required',
      );
      expect(() => user.assignRoles(undefined as unknown as string[])).toThrow(
        'At least one role is required',
      );
    });
  });

  describe('completeOnboarding()', () => {
    it('should set onBoardingCompleted to true and status to ACTIVE', () => {
      const props = makeProps({ onBoardingCompleted: false, status: UserStatusEnum.ONBOARDING });
      const user = UserEntity.create('user-1', props);

      user.completeOnboarding();

      expect(user.onBoardingCompleted).toBe(true);
      expect(user.status).toBe(UserStatusEnum.ACTIVE);
    });
  });

  describe('updateProfile()', () => {
    it('should update allowed fields only', () => {
      const user = UserEntity.create('user-1', makeProps());

      user.updateProfile({
        name: 'Jane Doe',
        nickName: 'JD',
        bio: 'New bio',
        phone: '1234567890',
      });

      expect(user.name).toBe('Jane Doe');
      expect(user.nickName).toBe('JD');
      expect(user.bio).toBe('New bio');
      expect(user.phone).toBe('1234567890');
    });

    it('should not modify fields that are not provided', () => {
      const user = UserEntity.create('user-1', makeProps({ name: 'Original' }));

      user.updateProfile({ nickName: 'Updated' });

      expect(user.name).toBe('Original');
      expect(user.nickName).toBe('Updated');
    });
  });

  describe('updateLastLogin()', () => {
    it('should set lastLogin to a recent date', () => {
      const user = UserEntity.create('user-1', makeProps());
      const before = new Date();

      user.updateLastLogin();

      const after = new Date();
      expect(user.lastLogin!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.lastLogin!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('recordLogin()', () => {
    it('should add domain event and update lastLogin', () => {
      const user = UserEntity.create('user-1', makeProps());
      user.clearDomainEvents();
      const before = new Date();

      user.recordLogin('google');

      const after = new Date();

      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0].eventName).toBe('user.logged-in');
      expect(user.domainEvents[0].payload).toEqual({
        userId: 'user-1',
        provider: 'google',
      });
      expect(user.lastLogin!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.lastLogin!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
