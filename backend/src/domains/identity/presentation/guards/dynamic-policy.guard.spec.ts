import { Reflector } from '@nestjs/core';
import { DynamicPolicyGuard } from './dynamic-policy.guard';
import { AbacRuleEngineService } from '@/domains/identity/application/services/abac-rule-engine.service';
import { RequestUser } from '../policies/policy-handler.interface';
import { RESOURCE_ACTION_KEY } from '../decorators/resource-action.decorator';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  userId: 'user1',
  departmentId: 'dept1',
  isSuperadmin: false,
  permVersion: 1,
  bitmap: Buffer.alloc(0),
  ...overrides,
});

const makeContext = (req: any) => {
  const handler = jest.fn();
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => jest.fn(),
  } as any;
};

describe('DynamicPolicyGuard', () => {
  let guard: DynamicPolicyGuard;
  let reflector: { get: jest.Mock };
  let ruleEngine: { evaluateResourceAccess: jest.Mock };

  beforeEach(() => {
    reflector = { get: jest.fn().mockReturnValue(undefined) };
    ruleEngine = { evaluateResourceAccess: jest.fn() };
    guard = new DynamicPolicyGuard(reflector as any, ruleEngine as any);
  });

  describe('canActivate', () => {
    it('returns true when no @ResourceAction decorator on handler', async () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = makeContext({ user: makeUser() });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(ruleEngine.evaluateResourceAccess).not.toHaveBeenCalled();
    });

    it('returns false when no user on request', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      const ctx = makeContext({ user: undefined });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
      expect(ruleEngine.evaluateResourceAccess).not.toHaveBeenCalled();
    });

    it('returns true when user.isSuperadmin is true (bypasses ABAC)', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      const ctx = makeContext({ user: makeUser({ isSuperadmin: true }) });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(ruleEngine.evaluateResourceAccess).not.toHaveBeenCalled();
    });

    it('evaluates ABAC even when no _resource is loaded (e.g. list endpoints)', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(true);
      const ctx = makeContext({ user: makeUser(), method: 'GET', path: '/devices' });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1' }),
        'device',
        'read',
        null,
      );
    });

    it('denies access when no resource and deny policy with no conditions', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(false);
      const ctx = makeContext({ user: makeUser(), method: 'GET', path: '/devices' });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1' }),
        'device',
        'read',
        null,
      );
    });

    it('returns true when ruleEngine.evaluateResourceAccess returns true', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(true);
      const ctx = makeContext({
        user: makeUser(),
        _resource: { _id: 'dev1', name: 'Device 1' },
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('returns false when ruleEngine.evaluateResourceAccess returns false', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'delete' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(false);
      const ctx = makeContext({
        user: makeUser(),
        _resource: { _id: 'dev1', name: 'Device 1' },
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('passes correct params to ruleEngine.evaluateResourceAccess', async () => {
      reflector.get.mockReturnValue({ resource: 'department', action: 'update' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(true);
      const user = makeUser({ userId: 'user-abc', departmentId: 'dept-x' });
      const resource = { _id: 'dep1', name: 'IT Department' };
      const ctx = makeContext({ user, _resource: resource });

      await guard.canActivate(ctx);

      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalledWith(
        user,
        'department',
        'update',
        resource,
      );
    });

    it('handles resource with _id for logging', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(false);
      const ctx = makeContext({
        user: makeUser({ userId: 'user-log-test' }),
        _resource: { _id: 'device-abc-123', name: 'Server 01' },
      });

      await guard.canActivate(ctx);

      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalled();
    });

    it('handles resource with id (not _id) for logging', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(false);
      const ctx = makeContext({
        user: makeUser({ userId: 'user-log-test' }),
        _resource: { id: 'plain-id-456', name: 'Server 02' },
      });

      await guard.canActivate(ctx);

      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalled();
    });

    it('handles resource with neither _id nor id (undefined in log)', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(false);
      const ctx = makeContext({
        user: makeUser({ userId: 'user-no-id' }),
        _resource: { name: 'No ID Resource' },
      });

      await guard.canActivate(ctx);

      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalled();
    });

    it('handles async rule engine resolution', async () => {
      reflector.get.mockReturnValue({ resource: 'document', action: 'approve' });
      let resolvePromise: (val: boolean) => void;
      const promise = new Promise<boolean>((resolve) => {
        resolvePromise = resolve;
      });
      ruleEngine.evaluateResourceAccess.mockReturnValue(promise);
      const ctx = makeContext({
        user: makeUser(),
        _resource: { _id: 'doc1' },
      });

      const resultPromise = guard.canActivate(ctx);
      resolvePromise!(true);
      const result = await resultPromise;

      expect(result).toBe(true);
    });

    it('passes null resource to rule engine when _resource is absent', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(true);
      const ctx = makeContext({
        user: makeUser(),
        method: 'GET',
        path: '/devices',
      });

      await guard.canActivate(ctx);

      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalledWith(
        expect.anything(),
        'device',
        'read',
        null,
      );
    });
  });
});
