import { ExecutionContext } from '@nestjs/common';
import { RequestUser } from './policy-handler.interface';
import { DepartmentOwnershipPolicy } from './department-ownership.policy';
import { SameDepartmentPolicy } from './same-department.policy';
import { OwnerOnlyPolicy } from './owner-only.policy';
import { ActiveResourcePolicy } from './active-resource.policy';
import { DepartmentOrSharedPolicy } from './department-or-shared.policy';
import { AndPolicy, OrPolicy } from './composite-policies';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  userId: 'u1',
  departmentId: 'dept1',
  isSuperadmin: false,
  permVersion: 1,
  bitmap: Buffer.alloc(0),
  ...overrides,
});

const makeContext = (req: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
  }) as any;

describe('DepartmentOwnershipPolicy', () => {
  let policy: DepartmentOwnershipPolicy;

  beforeEach(() => {
    policy = new DepartmentOwnershipPolicy();
  });

  it('allows when user department matches params.departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ params: { departmentId: 'dept1' } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('allows when user department matches body.departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ params: {}, body: { departmentId: 'dept1' } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('denies when user department differs from params', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ params: { departmentId: 'dept2' } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when user department differs from body', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ params: {}, body: { departmentId: 'dept2' } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when no departmentId in params or body', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ params: {}, body: {} });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('prefers params.departmentId over body.departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ params: { departmentId: 'dept1' }, body: { departmentId: 'dept2' } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });
});

describe('SameDepartmentPolicy', () => {
  let policy: SameDepartmentPolicy;

  beforeEach(() => {
    policy = new SameDepartmentPolicy();
  });

  it('allows when resource.departmentId matches user.departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { departmentId: 'dept1' } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('allows when resource.departmentId is an object with toString matching user.departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({
      _resource: { departmentId: { toString: () => 'dept1' } },
    });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('denies when resource.departmentId differs from user.departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { departmentId: 'dept2' } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when no resource attached', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when resource has no departmentId', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: {} });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });
});

describe('OwnerOnlyPolicy', () => {
  let policy: OwnerOnlyPolicy;

  beforeEach(() => {
    policy = new OwnerOnlyPolicy();
  });

  it('allows when resource.createdBy matches user.userId', () => {
    const user = makeUser({ userId: 'u1' });
    const ctx = makeContext({ _resource: { createdBy: 'u1' } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('allows when resource.createdBy is an object with toString matching user.userId', () => {
    const user = makeUser({ userId: 'u1' });
    const ctx = makeContext({
      _resource: { createdBy: { toString: () => 'u1' } },
    });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('denies when resource.createdBy differs from user.userId', () => {
    const user = makeUser({ userId: 'u1' });
    const ctx = makeContext({ _resource: { createdBy: 'u2' } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when no resource attached', () => {
    const user = makeUser({ userId: 'u1' });
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when resource has no createdBy', () => {
    const user = makeUser({ userId: 'u1' });
    const ctx = makeContext({ _resource: {} });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });
});

describe('ActiveResourcePolicy', () => {
  let policy: ActiveResourcePolicy;

  beforeEach(() => {
    policy = new ActiveResourcePolicy();
  });

  it('allows when isActive is true and no deletedAt', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: { isActive: true } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('denies when isActive is false', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: { isActive: false } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when deletedAt is set', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: { isActive: true, deletedAt: new Date() } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('allows when isActive is undefined (defaults to active)', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: {} });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('denies when isActive is false even without deletedAt', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: { isActive: false } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when deletedAt is set even if isActive is true', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: { isActive: true, deletedAt: new Date('2024-01-01') } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when both isActive is false and deletedAt is set', () => {
    const user = makeUser();
    const ctx = makeContext({ _resource: { isActive: false, deletedAt: new Date() } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });
});

describe('DepartmentOrSharedPolicy', () => {
  let policy: DepartmentOrSharedPolicy;

  beforeEach(() => {
    policy = new DepartmentOrSharedPolicy();
  });

  it('allows same department', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { departmentId: 'dept1', isShared: false } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('allows shared resource from different department', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { departmentId: 'dept2', isShared: true } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('allows shared resource without departmentId match', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { isShared: true } });

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('denies non-shared from different department', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { departmentId: 'dept2', isShared: false } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when no resource', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('denies when resource has no departmentId and is not shared', () => {
    const user = makeUser({ departmentId: 'dept1' });
    const ctx = makeContext({ _resource: { isShared: false } });

    expect(policy.canAccess(user, ctx)).toBe(false);
  });
});

describe('AndPolicy', () => {
  it('passes when all policies pass', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(true) };
    const p2 = { canAccess: jest.fn().mockReturnValue(true) };
    const policy = new AndPolicy([p1, p2]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(true);
    expect(p1.canAccess).toHaveBeenCalledWith(user, ctx);
    expect(p2.canAccess).toHaveBeenCalledWith(user, ctx);
  });

  it('fails when one policy fails', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(true) };
    const p2 = { canAccess: jest.fn().mockReturnValue(false) };
    const policy = new AndPolicy([p1, p2]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('fails when all policies fail', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(false) };
    const p2 = { canAccess: jest.fn().mockReturnValue(false) };
    const policy = new AndPolicy([p1, p2]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('passes with single passing policy', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(true) };
    const policy = new AndPolicy([p1]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('fails with single failing policy', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(false) };
    const policy = new AndPolicy([p1]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });
});

describe('OrPolicy', () => {
  it('passes when any policy passes', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(false) };
    const p2 = { canAccess: jest.fn().mockReturnValue(true) };
    const policy = new OrPolicy([p1, p2]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('fails when all policies fail', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(false) };
    const p2 = { canAccess: jest.fn().mockReturnValue(false) };
    const policy = new OrPolicy([p1, p2]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });

  it('passes when all policies pass', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(true) };
    const p2 = { canAccess: jest.fn().mockReturnValue(true) };
    const policy = new OrPolicy([p1, p2]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('passes with single passing policy', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(true) };
    const policy = new OrPolicy([p1]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(true);
  });

  it('fails with single failing policy', () => {
    const p1 = { canAccess: jest.fn().mockReturnValue(false) };
    const policy = new OrPolicy([p1]);
    const user = makeUser();
    const ctx = makeContext({});

    expect(policy.canAccess(user, ctx)).toBe(false);
  });
});
