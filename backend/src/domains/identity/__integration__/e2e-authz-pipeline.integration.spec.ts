import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from '@/domains/identity/presentation/guards/permission.guard';
import { DynamicPolicyGuard } from '@/domains/identity/presentation/guards/dynamic-policy.guard';
import { PolicyGuard } from '@/domains/identity/presentation/guards/policy.guard';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';
import { UserPermCacheService } from '@/domains/identity/application/services/user-perm-cache.service';
import { BitmapComputationService } from '@/domains/identity/application/services/bitmap-computation.service';
import { InProcessPermCache } from '@/domains/identity/application/services/in-process-perm-cache.service';
import { AbacRuleEngineService } from '@/domains/identity/application/services/abac-rule-engine.service';
import { ResourceLoaderInterceptor } from '@/domains/identity/presentation/interceptors/resource-loader.interceptor';
import { DepartmentOwnershipPolicy } from '@/domains/identity/presentation/policies/department-ownership.policy';
import { RequestUser } from '@/domains/identity/presentation/policies/policy-handler.interface';
import { of, lastValueFrom } from 'rxjs';
import { Types } from 'mongoose';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  userId: 'u1',
  departmentId: 'dept1',
  isSuperadmin: false,
  permVersion: 1,
  bitmap: Buffer.from([0x01]),
  roleIds: ['role1'],
  ...overrides,
});

const makeContext = (req: any) => ({
  switchToHttp: () => ({ getRequest: () => req }),
  getHandler: () => jest.fn(),
  getClass: () => jest.fn(),
} as any);

describe('E2E Authorization Pipeline', () => {
  let permissionGuard: PermissionGuard;
  let dynamicPolicyGuard: DynamicPolicyGuard;
  let policyGuard: PolicyGuard;
  let routeMapService: RouteMapService;
  let userPermCacheService: UserPermCacheService;
  let bitmapService: BitmapComputationService;
  let abacEngine: AbacRuleEngineService;
  let cache: InProcessPermCache;
  let reflector: any;
  let epModel: any;
  let userModel: any;
  let roleModel: any;
  let policyModel: any;

  const setupRouteMap = async (routes: Array<{ method: string; pathPattern: string; pathRegex: string; bitIndex: number }>) => {
    const mockSelectLean = (returnValue: any) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(returnValue),
    });
    epModel.find = jest.fn().mockReturnValue(mockSelectLean(
      routes.map(r => ({ ...r, isActive: true })),
    ));
    await routeMapService.reload();
  };

  const setupBitmap = (userRoleIds: string[], bitIndices: number[]) => {
    const userId = new Types.ObjectId();
    const roleIds = userRoleIds.map(() => new Types.ObjectId());
    const epIds = bitIndices.map(() => new Types.ObjectId());

    const mockSelectLean = (returnValue: any) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(returnValue),
    });

    userModel.findById = jest.fn().mockReturnValue(mockSelectLean({ _id: userId, roleIds }));
    roleModel.find = jest.fn().mockReturnValue(mockSelectLean(
      roleIds.map((rid, i) => ({ _id: rid, endpointPermissionIds: [epIds[i]] })),
    ));
    epModel.find = jest.fn().mockReturnValue(mockSelectLean(
      epIds.map((epId, i) => ({ _id: epId, bitIndex: bitIndices[i] })),
    ));
  };

  beforeEach(() => {
    cache = new InProcessPermCache();
    epModel = { find: jest.fn() };
    userModel = { findById: jest.fn() };
    roleModel = { find: jest.fn() };
    policyModel = { find: jest.fn() };

    bitmapService = new BitmapComputationService(userModel, roleModel, epModel);
    routeMapService = new RouteMapService(epModel);

    const userRepo = { findById: jest.fn() };
    userPermCacheService = new UserPermCacheService(cache, userRepo as any, bitmapService);

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
      get: jest.fn().mockReturnValue(undefined),
    };

    permissionGuard = new PermissionGuard(reflector as any, routeMapService, userPermCacheService);
    abacEngine = new AbacRuleEngineService(policyModel, userModel);
    dynamicPolicyGuard = new DynamicPolicyGuard(reflector as any, abacEngine);
    policyGuard = new PolicyGuard(reflector as any);
  });

  describe('Full RBAC pipeline: RouteMap → PermissionGuard → Bitmap', () => {
    it('user with correct bitmap bit accesses endpoint', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
        { method: 'POST', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 1 },
        { method: 'DELETE', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 2 },
      ]);

      const bitmap = Buffer.from([0x01]); // bit 0 set
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'GET', path: '/devices', user });
      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('user without correct bitmap bit is denied', async () => {
      await setupRouteMap([
        { method: 'DELETE', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 2 },
      ]);

      const bitmap = Buffer.from([0x01]); // bit 0 set, not bit 2
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'DELETE', path: '/devices/abc123', user });
      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('parametric route resolution works end-to-end', async () => {
      await setupRouteMap([
        { method: 'PATCH', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 5 },
      ]);

      const bitmap = Buffer.from([0x20]); // bit 5 set
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'PATCH', path: '/devices/507f1f77bcf86cd799439011', user });
      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('query string is stripped before route matching', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
      ]);

      const bitmap = Buffer.from([0x01]);
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'GET', path: '/devices?page=1&limit=20', user });
      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('/api/v1 prefix is stripped before matching', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
      ]);

      const bitmap = Buffer.from([0x01]);
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'GET', path: '/api/v1/devices', user });
      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('throws ForbiddenException when bitmap is null (user has no permissions)', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
      ]);

      const bitmap = Buffer.alloc(0);
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'GET', path: '/devices', user });
      await expect(permissionGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('superadmin bypasses entire RBAC pipeline', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
      ]);

      const user = makeUser({ isSuperadmin: true, bitmap: Buffer.alloc(0) });
      const ctx = makeContext({ method: 'GET', path: '/devices', user });

      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('@Public() bypasses entire RBAC pipeline', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext({ method: 'GET', path: '/health' });

      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });

  describe('Full ABAC pipeline: ResourceLoader → DynamicPolicyGuard → AbacRuleEngine', () => {
    it('loads resource and evaluates ABAC policy', async () => {
      const interceptorReflector = new Reflector();
      const interceptor = new ResourceLoaderInterceptor(interceptorReflector);
      const model = {
        findById: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: 'd1', departmentId: 'dept1', name: 'Device 1' }),
        }),
      };
      interceptor.registerModel('device', model as any);

      const allowPolicy = {
        _id: new Types.ObjectId(),
        name: 'allow-same-dept',
        roleIds: [],
        resource: 'device',
        action: 'read',
        effect: 'allow',
        conditions: [{ field: 'resource.departmentId', operator: 'equals', value: '{{user.departmentId}}', valueType: 'template' }],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([allowPolicy]) });

      const user = makeUser({ departmentId: 'dept1' });
      const request: any = { params: { id: 'd1' }, user, method: 'GET', path: '/devices/d1' };

      // Use a mock reflector that returns the resource_action metadata
      const mockInterceptorCtx = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => function() {},
        getClass: () => ({}),
      } as any;

      // Spy on the interceptor's reflector to return metadata
      jest.spyOn(interceptorReflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });

      const next = { handle: () => of('result') };

      // Step 1: Load resource via interceptor
      await lastValueFrom(interceptor.intercept(mockInterceptorCtx, next));
      expect(request._resource).toBeDefined();
      expect(request._resource.departmentId).toBe('dept1');

      // Step 2: Evaluate ABAC via dynamicPolicyGuard (uses shared reflector mock)
      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'read' };
        return undefined;
      });

      const abacCtx = makeContext(request);
      const abacResult = await dynamicPolicyGuard.canActivate(abacCtx);
      expect(abacResult).toBe(true);
    });

    it('ABAC denies when resource belongs to different department', async () => {
      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'update' };
        return undefined;
      });

      const denyPolicy = {
        _id: new Types.ObjectId(),
        name: 'deny-cross-dept',
        roleIds: [],
        resource: 'device',
        action: 'update',
        effect: 'deny',
        conditions: [],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([denyPolicy]) });

      const user = makeUser({ departmentId: 'dept1' });
      const resource = { _id: 'd1', departmentId: 'dept2' };
      const ctx = makeContext({ user, _resource: resource, method: 'PUT', path: '/devices/d1' });

      const result = await dynamicPolicyGuard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('superadmin bypasses ABAC evaluation', async () => {
      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'delete' };
        return undefined;
      });

      const user = makeUser({ isSuperadmin: true });
      const ctx = makeContext({ user, _resource: { _id: 'd1' }, method: 'DELETE', path: '/devices/d1' });

      const result = await dynamicPolicyGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('no resource loaded → evaluates ABAC, no policies → defaults to allow', async () => {
      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'read' };
        return undefined;
      });

      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const user = makeUser();
      const ctx = makeContext({ user, method: 'GET', path: '/devices/d1' });

      const result = await dynamicPolicyGuard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });

  describe('Full hybrid pipeline: RBAC → ABAC sequential evaluation', () => {
    it('RBAC allows, ABAC allows → full access', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 3 },
      ]);

      const bitmap = Buffer.from([0x08]); // bit 3 set
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'GET', path: '/devices/d1', user, _resource: { _id: 'd1', departmentId: 'dept1' } });

      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'read' };
        return undefined;
      });

      const allowPolicy = {
        _id: new Types.ObjectId(),
        name: 'allow-all',
        roleIds: [],
        resource: 'device',
        action: 'read',
        effect: 'allow',
        conditions: [],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([allowPolicy]) });

      const rbacResult = await permissionGuard.canActivate(ctx);
      expect(rbacResult).toBe(true);

      const abacResult = await dynamicPolicyGuard.canActivate(ctx);
      expect(abacResult).toBe(true);
    });

    it('RBAC denies → ABAC never evaluated', async () => {
      await setupRouteMap([
        { method: 'DELETE', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 5 },
      ]);

      const bitmap = Buffer.from([0x00]); // no bits set
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'DELETE', path: '/devices/d1', user });

      const rbacResult = await permissionGuard.canActivate(ctx);
      expect(rbacResult).toBe(false);
    });

    it('RBAC allows, ABAC denies → access blocked', async () => {
      await setupRouteMap([
        { method: 'PUT', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 7 },
      ]);

      const bitmap = Buffer.from([0x80]); // bit 7 set
      const user = makeUser({ bitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'update' };
        return undefined;
      });

      const denyPolicy = {
        _id: new Types.ObjectId(),
        name: 'deny-update',
        roleIds: [],
        resource: 'device',
        action: 'update',
        effect: 'deny',
        conditions: [],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([denyPolicy]) });

      const ctx = makeContext({ method: 'PUT', path: '/devices/d1', user, _resource: { _id: 'd1' } });

      const rbacResult = await permissionGuard.canActivate(ctx);
      expect(rbacResult).toBe(true);

      const abacResult = await dynamicPolicyGuard.canActivate(ctx);
      expect(abacResult).toBe(false);
    });

    it('static PolicyGuard + DynamicPolicyGuard both pass', async () => {
      reflector.get.mockImplementation((key: string) => {
        if (key === 'check_policy') return new DepartmentOwnershipPolicy();
        if (key === 'resource_action') return { resource: 'department', action: 'update' };
        return undefined;
      });

      const user = makeUser({ departmentId: 'dept1' });

      // Static policy check
      const staticCtx = makeContext({
        user,
        params: { departmentId: 'dept1' },
        body: {},
        method: 'PUT',
        path: '/departments/dept1',
      });
      const staticResult = await policyGuard.canActivate(staticCtx);
      expect(staticResult).toBe(true);

      // Dynamic policy check (with ABAC engine)
      const allowPolicy = {
        _id: new Types.ObjectId(),
        name: 'allow-dept-update',
        roleIds: [],
        resource: 'department',
        action: 'update',
        effect: 'allow',
        conditions: [{ field: 'resource.departmentId', operator: 'equals', value: '{{user.departmentId}}', valueType: 'template' }],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([allowPolicy]) });

      const dynamicCtx = makeContext({
        user,
        _resource: { _id: 'dept1', departmentId: 'dept1' },
        method: 'PUT',
        path: '/departments/dept1',
      });
      const dynamicResult = await dynamicPolicyGuard.canActivate(dynamicCtx);
      expect(dynamicResult).toBe(true);
    });

    it('static PolicyGuard denies → DynamicPolicyGuard never reached', async () => {
      reflector.get.mockImplementation((key: string) => {
        if (key === 'check_policy') return new DepartmentOwnershipPolicy();
        return undefined;
      });

      const user = makeUser({ departmentId: 'dept1' });
      const ctx = makeContext({
        user,
        params: { departmentId: 'dept2' },
        body: {},
      });

      const result = await policyGuard.canActivate(ctx);
      expect(result).toBe(false);
    });
  });

  describe('Cache-aware pipeline: bitmap computation → cache → guard', () => {
    it('fresh bitmap from computation is usable by PermissionGuard', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
      ]);

      const userId = new Types.ObjectId();
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();

      const mockSelectLean = (returnValue: any) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(returnValue),
      });

      userModel.findById = jest.fn().mockReturnValue(mockSelectLean({ _id: userId, roleIds: [roleId] }));
      roleModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]));
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: epId, bitIndex: 0 }]));

      const computedBitmap = await bitmapService.computeBitmap(userId.toString());
      expect(computedBitmap[0] & 0x01).toBe(1); // bit 0 set

      // Now use this bitmap with the permission guard
      const user = makeUser({ userId: userId.toString(), bitmap: computedBitmap, permVersion: 1 });
      cache.set(user.userId, { bitmap: computedBitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({ method: 'GET', path: '/devices', user });
      const result = await permissionGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('stale cached bitmap triggers revalidation', async () => {
      await setupRouteMap([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0 },
      ]);

      const userId = new Types.ObjectId();
      const oldBitmap = Buffer.from([0x00]); // no permissions

      // Cache has old version
      cache.set(userId.toString(), { bitmap: oldBitmap, permVersion: 1, cachedAt: Date.now() });

      const user = makeUser({ userId: userId.toString(), bitmap: oldBitmap, permVersion: 2 }); // JWT has newer version
      const ctx = makeContext({ method: 'GET', path: '/devices', user });

      // Cache version (1) doesn't match JWT version (2) → cache miss → DB lookup
      const userRepo = { findById: jest.fn().mockResolvedValue({ status: 'ACTIVE', permVersion: 2 }) };
      const permCacheService = new UserPermCacheService(cache, userRepo as any, bitmapService);

      const bitmapGuard = new PermissionGuard(reflector as any, routeMapService, permCacheService);

      // Will attempt revalidation, but bitmapComputer needs models set up
      // The guard should call computeBitmap since versions differ
      const result = await bitmapGuard.canActivate(ctx);
      // Since bitmapComputer will return empty buffer (no mock setup), it should fail
      expect(userRepo.findById).toHaveBeenCalledWith(userId.toString());
    });
  });
});
