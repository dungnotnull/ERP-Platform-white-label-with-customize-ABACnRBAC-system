import { PermissionGuard } from '@/domains/identity/presentation/guards/permission.guard';
import { DynamicPolicyGuard } from '@/domains/identity/presentation/guards/dynamic-policy.guard';

const makeRequest = (overrides: Record<string, any> = {}) => ({
  method: 'GET',
  path: '/devices',
  user: {
    userId: 'u1',
    permVersion: 1,
    bitmap: Buffer.alloc(0),
    isSuperadmin: false,
    departmentId: 'dept1',
  },
  ...overrides,
});

const makeContext = (req: any) => ({
  switchToHttp: () => ({ getRequest: () => req }),
  getHandler: () => jest.fn(),
  getClass: () => jest.fn(),
} as any);

const makeRbacGuard = (overrides: Record<string, any> = {}) => {
  return new PermissionGuard(
    { getAllAndOverride: jest.fn().mockReturnValue(undefined), get: jest.fn().mockReturnValue(undefined), ...overrides.reflector } as any,
    { resolve: jest.fn().mockReturnValue(0), ...overrides.routeMap } as any,
    { getBitmap: jest.fn().mockResolvedValue(Buffer.from([0x01])), ...overrides.cache } as any,
  );
};

const makeAbacGuard = (overrides: Record<string, any> = {}) => {
  return new DynamicPolicyGuard(
    { get: jest.fn().mockReturnValue({ resource: 'device', action: 'read' }), ...overrides.reflector } as any,
    { evaluateResourceAccess: jest.fn().mockResolvedValue(true), ...overrides.engine } as any,
  );
};

describe('Hybrid RBAC + ABAC Integration', () => {
  describe('RBAC allow + ABAC allow', () => {
    it('both guards pass → full access', async () => {
      const rbacGuard = makeRbacGuard();
      const abacGuard = makeAbacGuard();

      const req = makeRequest({ _resource: { _id: 'd1' } });
      const ctx = makeContext(req);

      expect(await rbacGuard.canActivate(ctx)).toBe(true);
      expect(await abacGuard.canActivate(ctx)).toBe(true);
    });
  });

  describe('RBAC allow + ABAC deny', () => {
    it('RBAC passes but ABAC denies', async () => {
      const rbacGuard = makeRbacGuard();
      const abacGuard = makeAbacGuard({
        reflector: { get: jest.fn().mockReturnValue({ resource: 'device', action: 'delete' }) },
        engine: { evaluateResourceAccess: jest.fn().mockResolvedValue(false) },
      });

      const ctx = makeContext(makeRequest({ _resource: { _id: 'd1' } }));

      expect(await rbacGuard.canActivate(ctx)).toBe(true);
      expect(await abacGuard.canActivate(ctx)).toBe(false);
    });
  });

  describe('RBAC deny (ABAC never reached)', () => {
    it('PermissionGuard denies before ABAC evaluation', async () => {
      const rbacGuard = makeRbacGuard({ routeMap: { resolve: jest.fn().mockReturnValue(null) } });
      expect(await rbacGuard.canActivate(makeContext(makeRequest()))).toBe(false);
    });
  });

  describe('Superadmin bypasses both', () => {
    it('superadmin skips both RBAC and ABAC', async () => {
      const rbacGuard = makeRbacGuard();
      const abacGuard = makeAbacGuard();

      const req = makeRequest({
        user: { ...makeRequest().user, isSuperadmin: true },
        _resource: { _id: 'd1' },
      });
      const ctx = makeContext(req);

      expect(await rbacGuard.canActivate(ctx)).toBe(true);
      expect(await abacGuard.canActivate(ctx)).toBe(true);
    });
  });
});
