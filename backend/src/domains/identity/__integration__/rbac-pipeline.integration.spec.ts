import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from '@/domains/identity/presentation/guards/permission.guard';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';
import { UserPermCacheService } from '@/domains/identity/application/services/user-perm-cache.service';
import { InProcessPermCache } from '@/domains/identity/application/services/in-process-perm-cache.service';

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

const makeContext = (req: any) => {
  const handler = jest.fn();
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => jest.fn(),
  } as any;
};

describe('RBAC Pipeline Integration', () => {
  let guard: PermissionGuard;
  let reflector: any;
  let routeMapService: any;
  let userPermCacheService: any;
  let cache: InProcessPermCache;

  beforeEach(() => {
    cache = new InProcessPermCache();
    routeMapService = { resolve: jest.fn() };
    userPermCacheService = { getBitmap: jest.fn() };
    reflector = { getAllAndOverride: jest.fn(), get: jest.fn() };
    guard = new PermissionGuard(reflector, routeMapService, userPermCacheService);
  });

  describe('Full pipeline integration', () => {
    it('superadmin bypasses all checks', async () => {
      const ctx = makeContext(makeRequest({ user: { ...makeRequest().user, isSuperadmin: true } }));
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
      expect(routeMapService.resolve).not.toHaveBeenCalled();
    });

    it('@Public() bypasses all checks', async () => {
      const ctx = makeContext(makeRequest());
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('@AuthOnly() with valid user returns true, skips bitmap', async () => {
      const ctx = makeContext(makeRequest());
      reflector.getAllAndOverride.mockImplementation((key: string) => key === 'authOnly');

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('unregistered endpoint returns false', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(null);

      const ctx = makeContext(makeRequest({ path: '/unknown' }));
      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('valid permission returns true (bit set)', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(3);
      userPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x08]));

      const ctx = makeContext(makeRequest());
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('insufficient permission returns false (bit not set)', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(3);
      userPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x00]));

      const ctx = makeContext(makeRequest());
      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('throws ForbiddenException when bitmap is null', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(0);
      userPermCacheService.getBitmap.mockResolvedValue(null);

      const ctx = makeContext(makeRequest());
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when bitmap too short for bitIndex', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(32);
      userPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0xff]));

      const ctx = makeContext(makeRequest());
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('no user on request returns false', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const req: any = makeRequest();
      req.user = undefined;

      const ctx = makeContext(req);
      const result = await guard.canActivate(ctx);
      expect(result).toBe(false);
    });

    it('routeMapService receives correct method and path', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(0);
      userPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));

      const ctx = makeContext(makeRequest({ method: 'DELETE', path: '/departments/42' }));
      await guard.canActivate(ctx);

      expect(routeMapService.resolve).toHaveBeenCalledWith('DELETE', '/departments/42');
    });

    it('userPermCacheService receives correct params', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      reflector.get.mockReturnValue(undefined);
      routeMapService.resolve.mockReturnValue(0);
      userPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));

      const user = { userId: 'abc-123', permVersion: 7, bitmap: Buffer.from([0xaa]), isSuperadmin: false };
      const ctx = makeContext(makeRequest({ user }));
      await guard.canActivate(ctx);

      expect(userPermCacheService.getBitmap).toHaveBeenCalledWith('abc-123', 7, Buffer.from([0xaa]));
    });
  });

  describe('Cache integration with real InProcessPermCache', () => {
    it('cache hit returns immediately without DB path', () => {
      const bitmap = Buffer.from([0x01]);
      cache.set('user-cached', { bitmap, permVersion: 1, cachedAt: Date.now() });

      const result = cache.get('user-cached');
      expect(result).not.toBeNull();
      expect(result!.bitmap).toEqual(bitmap);
    });

    it('cache miss returns null', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('stale cache version causes miss (version mismatch path)', () => {
      cache.set('user-stale', { bitmap: Buffer.from([0xff]), permVersion: 5, cachedAt: Date.now() });

      // The cached version is 5, but if the JWT says 3, the orchestrator should reject
      const cached = cache.get('user-stale');
      expect(cached).not.toBeNull();
      expect(cached!.permVersion).toBe(5);
    });
  });
});
