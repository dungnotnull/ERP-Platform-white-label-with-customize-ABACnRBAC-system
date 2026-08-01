import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { DynamicPolicyGuard } from '@/domains/identity/presentation/guards/dynamic-policy.guard';
import { AbacRuleEngineService } from '@/domains/identity/application/services/abac-rule-engine.service';
import { ResourceLoaderInterceptor } from '@/domains/identity/presentation/interceptors/resource-loader.interceptor';
import { of, lastValueFrom } from 'rxjs';

const makeRequest = (overrides: Record<string, any> = {}) => ({
  params: {},
  _resource: undefined,
  ...overrides,
});

describe('ABAC Pipeline Integration', () => {
  describe('DynamicPolicyGuard', () => {
    let guard: DynamicPolicyGuard;
    let reflector: any;
    let ruleEngine: any;

    beforeEach(() => {
      reflector = { get: jest.fn() };
      ruleEngine = { evaluateResourceAccess: jest.fn() };
      guard = new DynamicPolicyGuard(reflector, ruleEngine);
    });

    it('no @ResourceAction decorator → pass through', async () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = { switchToHttp: () => ({ getRequest: () => ({ user: {} }) }), getHandler: () => jest.fn() } as any;
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('no user → deny', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      const ctx = { switchToHttp: () => ({ getRequest: () => ({}) }), getHandler: () => jest.fn() } as any;
      expect(await guard.canActivate(ctx)).toBe(false);
    });

    it('superadmin bypasses ABAC', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      const ctx = makeContext({ user: { userId: 'sa', isSuperadmin: true } });
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('no resource loaded → evaluates ABAC with null resource', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(true);
      const ctx = makeContext({ user: { userId: 'u1', isSuperadmin: false } });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalledWith(
        { userId: 'u1', isSuperadmin: false },
        'device',
        'read',
        null,
      );
    });

    it('ruleEngine allows → returns true', async () => {
      reflector.get.mockReturnValue({ resource: 'department', action: 'update' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(true);
      const ctx = makeContext({
        user: { userId: 'u1', isSuperadmin: false, departmentId: 'd1' },
        _resource: { _id: 'dep1', departmentId: 'd1' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(ruleEngine.evaluateResourceAccess).toHaveBeenCalled();
    });

    it('ruleEngine denies → returns false', async () => {
      reflector.get.mockReturnValue({ resource: 'department', action: 'delete' });
      ruleEngine.evaluateResourceAccess.mockResolvedValue(false);
      const ctx = makeContext({
        user: { userId: 'u1', isSuperadmin: false },
        _resource: { _id: 'dep1' },
      });
      expect(await guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('ResourceLoaderInterceptor', () => {
    let interceptor: ResourceLoaderInterceptor;
    let reflector: any;
    let model: any;

    beforeEach(() => {
      reflector = new Reflector();
      model = { findById: jest.fn() };
      interceptor = new ResourceLoaderInterceptor(reflector);
    });

    it('loads resource and attaches to request', async () => {
      interceptor.registerModel('device', model as any);
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });
      const doc = { _id: 'd1', departmentId: 'dept-x' };
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(doc) });

      const request = makeRequest({ params: { id: 'd1' } });
      const ctx = { switchToHttp: () => ({ getRequest: () => request }), getHandler: jest.fn() } as any;
      const next = { handle: () => of('done') };

      await lastValueFrom(interceptor.intercept(ctx, next));
      expect(request._resource).toEqual(doc);
    });

    it('no decorator → pass through unchanged', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      const ctx = { switchToHttp: () => ({ getRequest: () => ({}) }), getHandler: jest.fn() } as any;
      const next = { handle: () => of('original') };
      expect(await lastValueFrom(interceptor.intercept(ctx, next))).toBe('original');
    });
  });
});

function makeContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any;
}
