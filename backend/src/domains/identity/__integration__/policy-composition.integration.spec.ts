import { PolicyGuard } from '@/domains/identity/presentation/guards/policy.guard';
import { DynamicPolicyGuard } from '@/domains/identity/presentation/guards/dynamic-policy.guard';
import { PermissionGuard } from '@/domains/identity/presentation/guards/permission.guard';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';
import { UserPermCacheService } from '@/domains/identity/application/services/user-perm-cache.service';
import { InProcessPermCache } from '@/domains/identity/application/services/in-process-perm-cache.service';
import { AbacRuleEngineService } from '@/domains/identity/application/services/abac-rule-engine.service';
import { DepartmentOwnershipPolicy } from '@/domains/identity/presentation/policies/department-ownership.policy';
import { SameDepartmentPolicy } from '@/domains/identity/presentation/policies/same-department.policy';
import { OwnerOnlyPolicy } from '@/domains/identity/presentation/policies/owner-only.policy';
import { ActiveResourcePolicy } from '@/domains/identity/presentation/policies/active-resource.policy';
import { DepartmentOrSharedPolicy } from '@/domains/identity/presentation/policies/department-or-shared.policy';
import { AndPolicy, OrPolicy } from '@/domains/identity/presentation/policies/composite-policies';
import { RequestUser } from '@/domains/identity/presentation/policies/policy-handler.interface';
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

describe('Policy Composition Integration', () => {
  describe('PolicyGuard with static ABAC policies', () => {
    let guard: PolicyGuard;
    let reflector: { get: jest.Mock };

    beforeEach(() => {
      reflector = { get: jest.fn() };
      guard = new PolicyGuard(reflector as any);
    });

    it('DepartmentOwnershipPolicy + SameDepartmentPolicy via AndPolicy', async () => {
      const deptOwnership = new DepartmentOwnershipPolicy();
      const sameDept = new SameDepartmentPolicy();
      const combinedPolicy = new AndPolicy([deptOwnership, sameDept]);

      reflector.get.mockReturnValue(combinedPolicy);

      const user = makeUser({ departmentId: 'dept1' });
      const ctx = makeContext({
        user,
        params: { departmentId: 'dept1' },
        _resource: { departmentId: 'dept1' },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('AndPolicy fails when one sub-policy fails', async () => {
      const deptOwnership = new DepartmentOwnershipPolicy();
      const sameDept = new SameDepartmentPolicy();
      const combinedPolicy = new AndPolicy([deptOwnership, sameDept]);

      reflector.get.mockReturnValue(combinedPolicy);

      const user = makeUser({ departmentId: 'dept1' });
      const ctx = makeContext({
        user,
        params: { departmentId: 'dept1' }, // params match
        _resource: { departmentId: 'dept2' }, // resource doesn't match
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('OrPolicy passes when either sub-policy passes', async () => {
      const ownerOnly = new OwnerOnlyPolicy();
      const deptOrShared = new DepartmentOrSharedPolicy();
      const combinedPolicy = new OrPolicy([ownerOnly, deptOrShared]);

      reflector.get.mockReturnValue(combinedPolicy);

      const user = makeUser({ userId: 'user-abc', departmentId: 'dept1' });
      // Not the owner, but same department
      const ctx = makeContext({
        user,
        _resource: { createdBy: 'other-user', departmentId: 'dept1', isShared: false },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('OrPolicy fails when all sub-policies fail', async () => {
      const ownerOnly = new OwnerOnlyPolicy();
      const deptOrShared = new DepartmentOrSharedPolicy();
      const combinedPolicy = new OrPolicy([ownerOnly, deptOrShared]);

      reflector.get.mockReturnValue(combinedPolicy);

      const user = makeUser({ userId: 'user-abc', departmentId: 'dept1' });
      // Not the owner, different department, not shared
      const ctx = makeContext({
        user,
        _resource: { createdBy: 'other-user', departmentId: 'dept2', isShared: false },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('ActiveResourcePolicy combined with OwnerOnlyPolicy via AndPolicy', async () => {
      const activeCheck = new ActiveResourcePolicy();
      const ownerCheck = new OwnerOnlyPolicy();
      const combinedPolicy = new AndPolicy([activeCheck, ownerCheck]);

      reflector.get.mockReturnValue(combinedPolicy);

      const user = makeUser({ userId: 'creator-1' });

      // Active and owner → passes
      const ctx1 = makeContext({
        user,
        _resource: { isActive: true, createdBy: 'creator-1' },
      });
      expect(await guard.canActivate(ctx1)).toBe(true);

      // Active but NOT owner → fails
      const ctx2 = makeContext({
        user,
        _resource: { isActive: true, createdBy: 'creator-2' },
      });
      expect(await guard.canActivate(ctx2)).toBe(false);

      // Owner but archived → fails
      const ctx3 = makeContext({
        user,
        _resource: { isActive: false, createdBy: 'creator-1' },
      });
      expect(await guard.canActivate(ctx3)).toBe(false);
    });

    it('superadmin bypasses all static ABAC policies', async () => {
      const strictPolicy = new AndPolicy([
        new OwnerOnlyPolicy(),
        new SameDepartmentPolicy(),
        new ActiveResourcePolicy(),
      ]);

      reflector.get.mockReturnValue(strictPolicy);

      const user = makeUser({ isSuperadmin: true, userId: 'sa', departmentId: 'dept-sa' });
      const ctx = makeContext({
        user,
        _resource: { createdBy: 'other', departmentId: 'other-dept', isActive: false },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });

  describe('DynamicPolicyGuard with AbacRuleEngine', () => {
    let guard: DynamicPolicyGuard;
    let reflector: { get: jest.Mock };
    let abacEngine: AbacRuleEngineService;
    let policyModel: any;
    let userModel: any;

    beforeEach(() => {
      policyModel = { find: jest.fn() };
      userModel = { findById: jest.fn() };
      reflector = { get: jest.fn() };
      abacEngine = new AbacRuleEngineService(policyModel, userModel);
      guard = new DynamicPolicyGuard(reflector as any, abacEngine);
    });

    it('deny policy blocks access even when resource matches user department', async () => {
      reflector.get.mockReturnValue({ resource: 'department', action: 'update' });

      const denyPolicy = {
        _id: new Types.ObjectId(),
        name: 'deny-dept-update',
        roleIds: [],
        resource: 'department',
        action: 'update',
        effect: 'deny',
        conditions: [],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([denyPolicy]) });

      const user = makeUser({ departmentId: 'dept1' });
      const ctx = makeContext({
        user,
        _resource: { _id: 'dept1', departmentId: 'dept1' },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('allow policy with template condition grants access to own department resources', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'read' });

      const allowPolicy = {
        _id: new Types.ObjectId(),
        name: 'allow-own-dept',
        roleIds: [],
        resource: 'device',
        action: 'read',
        effect: 'allow',
        conditions: [{
          field: 'resource.departmentId',
          operator: 'equals',
          value: '{{user.departmentId}}',
          valueType: 'template',
        }],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([allowPolicy]) });

      const user = makeUser({ departmentId: 'dept1' });
      const ctx = makeContext({
        user,
        _resource: { _id: 'd1', departmentId: 'dept1' },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('deny with matching conditions blocks, then allow cannot override', async () => {
      reflector.get.mockReturnValue({ resource: 'device', action: 'delete' });

      const denyPolicy = {
        _id: new Types.ObjectId(),
        name: 'deny-low-priority',
        roleIds: [],
        resource: 'device',
        action: 'delete',
        effect: 'deny',
        conditions: [{
          field: 'resource.priority',
          operator: 'lt',
          value: 5,
          valueType: 'static',
        }],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      const allowPolicy = {
        _id: new Types.ObjectId(),
        name: 'allow-all-delete',
        roleIds: [],
        resource: 'device',
        action: 'delete',
        effect: 'allow',
        conditions: [],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([denyPolicy, allowPolicy]) });

      const user = makeUser();
      // priority 3 < 5 → deny conditions match → blocked
      const ctx = makeContext({
        user,
        _resource: { _id: 'd1', priority: 3 },
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });
  });

  describe('Three-layer composition: RBAC → Static ABAC → Dynamic ABAC', () => {
    let rbacGuard: PermissionGuard;
    let staticAbacGuard: PolicyGuard;
    let dynamicAbacGuard: DynamicPolicyGuard;
    let reflector: any;
    let routeMapService: RouteMapService;
    let cache: InProcessPermCache;
    let userPermCacheService: UserPermCacheService;
    let policyModel: any;
    let userModel: any;
    let epModel: any;
    let userRepo: any;

    const setupRoutes = async () => {
      const mockSelectLean = (returnValue: any) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(returnValue),
      });
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([
        { method: 'GET', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 3, isActive: true },
        { method: 'PUT', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 4, isActive: true },
        { method: 'DELETE', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 5, isActive: true },
      ]));
      await routeMapService.reload();
    };

    beforeEach(() => {
      cache = new InProcessPermCache();
      epModel = { find: jest.fn() };
      userModel = { findById: jest.fn() };
      policyModel = { find: jest.fn() };
      userRepo = { findById: jest.fn() };

      const bitmapService = { computeBitmap: jest.fn() };
      userPermCacheService = new UserPermCacheService(cache, userRepo, bitmapService as any);
      routeMapService = new RouteMapService(epModel as any);

      reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(undefined),
        get: jest.fn().mockReturnValue(undefined),
      };

      rbacGuard = new PermissionGuard(reflector as any, routeMapService, userPermCacheService);
      staticAbacGuard = new PolicyGuard(reflector as any);

      const abacEngine = new AbacRuleEngineService(policyModel, userModel);
      dynamicAbacGuard = new DynamicPolicyGuard(reflector as any, abacEngine);
    });

    it('all three layers pass: RBAC → static → dynamic', async () => {
      await setupRoutes();

      const bitmap = Buffer.from([0x08]); // bit 3 set
      const user = makeUser({ bitmap, permVersion: 1, departmentId: 'dept1' });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({
        method: 'GET',
        path: '/devices/d1',
        user,
        params: { id: 'd1' },
        _resource: { _id: 'd1', departmentId: 'dept1' },
      });

      // RBAC: bit 3 set → pass
      const rbacResult = await rbacGuard.canActivate(ctx);
      expect(rbacResult).toBe(true);

      // Static: SameDepartmentPolicy → pass
      reflector.get.mockImplementation((key: string) => {
        if (key === 'check_policy') return new SameDepartmentPolicy();
        return undefined;
      });
      const staticResult = await staticAbacGuard.canActivate(ctx);
      expect(staticResult).toBe(true);

      // Dynamic: allow same department
      reflector.get.mockImplementation((key: string) => {
        if (key === 'resource_action') return { resource: 'device', action: 'read' };
        return undefined;
      });
      const allowPolicy = {
        _id: new Types.ObjectId(),
        name: 'allow-dept',
        roleIds: [],
        resource: 'device',
        action: 'read',
        effect: 'allow',
        conditions: [{
          field: 'resource.departmentId',
          operator: 'equals',
          value: '{{user.departmentId}}',
          valueType: 'template',
        }],
        isActive: true,
        createdBy: new Types.ObjectId(),
      };
      policyModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([allowPolicy]) });

      const dynamicResult = await dynamicAbacGuard.canActivate(ctx);
      expect(dynamicResult).toBe(true);
    });

    it('RBAC passes, static ABAC denies → dynamic never evaluated', async () => {
      await setupRoutes();

      const bitmap = Buffer.from([0x08]); // bit 3 set
      const user = makeUser({ bitmap, permVersion: 1, departmentId: 'dept1' });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({
        method: 'GET',
        path: '/devices/d1',
        user,
        params: { id: 'd1' },
        _resource: { _id: 'd1', departmentId: 'dept2' }, // different department
      });

      const rbacResult = await rbacGuard.canActivate(ctx);
      expect(rbacResult).toBe(true);

      reflector.get.mockImplementation((key: string) => {
        if (key === 'check_policy') return new SameDepartmentPolicy();
        return undefined;
      });
      const staticResult = await staticAbacGuard.canActivate(ctx);
      expect(staticResult).toBe(false);
    });

    it('RBAC passes, static passes, dynamic denies → full block', async () => {
      await setupRoutes();

      const bitmap = Buffer.from([0x10]); // bit 4 set
      const user = makeUser({ bitmap, permVersion: 1, departmentId: 'dept1' });
      cache.set(user.userId, { bitmap, permVersion: 1, cachedAt: Date.now() });

      const ctx = makeContext({
        method: 'PUT',
        path: '/devices/d1',
        user,
        params: { id: 'd1' },
        _resource: { _id: 'd1', departmentId: 'dept1' },
      });

      // RBAC pass
      const rbacResult = await rbacGuard.canActivate(ctx);
      expect(rbacResult).toBe(true);

      // Static pass (no @CheckPolicy decorator)
      reflector.get.mockReturnValue(undefined);
      const staticResult = await staticAbacGuard.canActivate(ctx);
      expect(staticResult).toBe(true);

      // Dynamic deny
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

      const dynamicResult = await dynamicAbacGuard.canActivate(ctx);
      expect(dynamicResult).toBe(false);
    });

    it('superadmin bypasses all three layers', async () => {
      await setupRoutes();

      const user = makeUser({ isSuperadmin: true, bitmap: Buffer.alloc(0) });
      const ctx = makeContext({
        method: 'DELETE',
        path: '/devices/d1',
        user,
        params: { id: 'd1' },
        _resource: { _id: 'd1', departmentId: 'other-dept' },
      });

      expect(await rbacGuard.canActivate(ctx)).toBe(true);
      expect(await staticAbacGuard.canActivate(ctx)).toBe(true);
      expect(await dynamicAbacGuard.canActivate(ctx)).toBe(true);
    });
  });
});
