import { Reflector } from '@nestjs/core';
import { PolicyGuard } from './policy.guard';
import { IPolicyHandler, RequestUser } from '../policies/policy-handler.interface';

describe('PolicyGuard', () => {
  let guard: PolicyGuard;
  let mockReflector: { get: jest.Mock };

  const makeContext = (req: any) => {
    const handler = jest.fn();
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
      getClass: () => jest.fn(),
    } as any;
  };

  const baseUser: RequestUser = {
    userId: 'user-123',
    departmentId: 'dept-1',
    isSuperadmin: false,
    permVersion: 1,
    bitmap: Buffer.from([0]),
  };

  beforeEach(() => {
    mockReflector = { get: jest.fn().mockReturnValue(undefined) };
    guard = new PolicyGuard(mockReflector as any);
  });

  it('should return true when no policy is set (no @CheckPolicy decorator)', async () => {
    mockReflector.get.mockReturnValue(undefined);
    const ctx = makeContext({ user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should return false when no user on request', async () => {
    const policy: IPolicyHandler = { canAccess: jest.fn().mockReturnValue(true) };
    mockReflector.get.mockReturnValue(policy);
    const ctx = makeContext({ user: undefined });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
    expect(policy.canAccess).not.toHaveBeenCalled();
  });

  it('should return true when user.isSuperadmin is true', async () => {
    const policy: IPolicyHandler = { canAccess: jest.fn().mockReturnValue(false) };
    mockReflector.get.mockReturnValue(policy);
    const ctx = makeContext({ user: { ...baseUser, isSuperadmin: true } });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policy.canAccess).not.toHaveBeenCalled();
  });

  it('should return true when policy.canAccess returns true', async () => {
    const policy: IPolicyHandler = { canAccess: jest.fn().mockReturnValue(true) };
    mockReflector.get.mockReturnValue(policy);
    const ctx = makeContext({ user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policy.canAccess).toHaveBeenCalledWith(baseUser, ctx);
  });

  it('should return false when policy.canAccess returns false', async () => {
    const policy: IPolicyHandler = { canAccess: jest.fn().mockReturnValue(false) };
    mockReflector.get.mockReturnValue(policy);
    const ctx = makeContext({ user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
    expect(policy.canAccess).toHaveBeenCalledWith(baseUser, ctx);
  });

  it('should handle async policy handlers', async () => {
    const policy: IPolicyHandler = {
      canAccess: jest.fn().mockResolvedValue(true),
    };
    mockReflector.get.mockReturnValue(policy);
    const ctx = makeContext({ user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policy.canAccess).toHaveBeenCalledWith(baseUser, ctx);
  });

  it('should handle async policy handlers that return false', async () => {
    const policy: IPolicyHandler = {
      canAccess: jest.fn().mockResolvedValue(false),
    };
    mockReflector.get.mockReturnValue(policy);
    const ctx = makeContext({ user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('should pass correct user and context to policy handler', async () => {
    const canAccessSpy = jest.fn().mockReturnValue(true);
    const policy: IPolicyHandler = { canAccess: canAccessSpy };
    mockReflector.get.mockReturnValue(policy);
    const specificUser: RequestUser = {
      userId: 'user-456',
      departmentId: 'dept-2',
      isSuperadmin: false,
      permVersion: 3,
      bitmap: Buffer.from([0xff]),
    };
    const ctx = makeContext({ user: specificUser });

    await guard.canActivate(ctx);

    expect(canAccessSpy).toHaveBeenCalledTimes(1);
    expect(canAccessSpy).toHaveBeenCalledWith(specificUser, ctx);
  });
});
