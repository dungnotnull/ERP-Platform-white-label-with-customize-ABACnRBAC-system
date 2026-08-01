import { UserPermCacheService } from '@/domains/identity/application/services/user-perm-cache.service';
import { InProcessPermCache } from '@/domains/identity/application/services/in-process-perm-cache.service';
import { BitmapComputationService } from '@/domains/identity/application/services/bitmap-computation.service';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';
import { PermissionGuard } from '@/domains/identity/presentation/guards/permission.guard';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { Types } from 'mongoose';

describe('Cache Revalidation Integration', () => {
  let cache: InProcessPermCache;
  let userRepo: { findById: jest.Mock };
  let bitmapComputer: { computeBitmap: jest.Mock };
  let service: UserPermCacheService;

  beforeEach(() => {
    cache = new InProcessPermCache();
    userRepo = { findById: jest.fn() };
    bitmapComputer = { computeBitmap: jest.fn() };

    service = new UserPermCacheService(
      cache as IPermissionCacheService,
      userRepo as any,
      bitmapComputer as IBitmapComputationService,
    );
  });

  describe('Cache hit path (no DB calls)', () => {
    it('cache hit with matching permVersion returns bitmap immediately', async () => {
      const bitmap = Buffer.from([0xff]);
      cache.set('u1', { bitmap, permVersion: 5, cachedAt: Date.now() });

      const result = await service.getBitmap('u1', 5, Buffer.alloc(0));

      expect(result).toEqual(bitmap);
      expect(userRepo.findById).not.toHaveBeenCalled();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('multiple sequential cache hits serve from cache without DB', async () => {
      const bitmap = Buffer.from([0x01, 0x02]);
      cache.set('u1', { bitmap, permVersion: 1, cachedAt: Date.now() });

      for (let i = 0; i < 5; i++) {
        const result = await service.getBitmap('u1', 1, Buffer.alloc(0));
        expect(result).toEqual(bitmap);
      }

      expect(userRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('Cache miss → JWT bitmap path', () => {
    it('cache miss, DB permVersion matches JWT → uses JWT bitmap, caches it', async () => {
      const jwtBitmap = Buffer.from([0xaa]);
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 5 });

      const result = await service.getBitmap('u1', 5, jwtBitmap);

      expect(result).toEqual(jwtBitmap);
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
      const cached = cache.get('u1');
      expect(cached).not.toBeNull();
      expect(cached!.bitmap).toEqual(jwtBitmap);
      expect(cached!.permVersion).toBe(5);
    });

    it('after JWT bitmap cached, subsequent requests hit cache', async () => {
      const jwtBitmap = Buffer.from([0x55]);
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 3 });
      await service.getBitmap('u1', 3, jwtBitmap);

      // Second call should hit cache
      const result = await service.getBitmap('u1', 3, Buffer.alloc(0));
      expect(result).toEqual(jwtBitmap);
      expect(userRepo.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache miss → bitmap recompute path', () => {
    it('cache miss, DB permVersion differs from JWT → recomputes bitmap', async () => {
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 10 });
      const freshBitmap = Buffer.from([0x0f]);
      bitmapComputer.computeBitmap.mockResolvedValue(freshBitmap);

      const result = await service.getBitmap('u1', 5, Buffer.alloc(0));

      expect(result).toEqual(freshBitmap);
      expect(bitmapComputer.computeBitmap).toHaveBeenCalledWith('u1');

      const cached = cache.get('u1');
      expect(cached).not.toBeNull();
      expect(cached!.bitmap).toEqual(freshBitmap);
      expect(cached!.permVersion).toBe(10);
    });

    it('recomputed bitmap is served from cache on next request', async () => {
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 8 });
      const freshBitmap = Buffer.from([0xff]);
      bitmapComputer.computeBitmap.mockResolvedValue(freshBitmap);

      // First call: miss → recompute
      await service.getBitmap('u1', 5, Buffer.alloc(0));

      // Second call: cache hit (cached with permVersion 8)
      const result = await service.getBitmap('u1', 8, Buffer.alloc(0));
      expect(result).toEqual(freshBitmap);
      expect(bitmapComputer.computeBitmap).toHaveBeenCalledTimes(1); // only once
    });
  });

  describe('permVersion bump triggers revalidation', () => {
    it('version bump from 5 to 6 invalidates cache', async () => {
      const oldBitmap = Buffer.from([0x01]);
      cache.set('u1', { bitmap: oldBitmap, permVersion: 5, cachedAt: Date.now() });

      // JWT has version 6, cache has 5 → miss
      // DB says permVersion = 6, JWT says 6 → JWT bitmap is used
      const jwtBitmap = Buffer.from([0x03]);
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 6 });

      const result = await service.getBitmap('u1', 6, jwtBitmap);

      expect(result).toEqual(jwtBitmap);
      // JWT bitmap was used, no recomputation needed
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('rapid version bumps (5→6→7) each revalidate', async () => {
      userRepo.findById
        .mockResolvedValueOnce({ status: 'ACTIVE', permVersion: 6 })
        .mockResolvedValueOnce({ status: 'ACTIVE', permVersion: 7 });

      // Version 5 → cache miss → DB says 6, JWT says 5 → recompute
      bitmapComputer.computeBitmap
        .mockResolvedValueOnce(Buffer.from([0x01]));

      const r1 = await service.getBitmap('u1', 5, Buffer.alloc(0));
      expect(r1).toEqual(Buffer.from([0x01]));

      // Cache now has permVersion 6. JWT says 7 → miss → DB says 7, JWT says 7 → use JWT
      const jwtBitmap = Buffer.from([0x03]);
      const r2 = await service.getBitmap('u1', 7, jwtBitmap);
      expect(r2).toEqual(jwtBitmap);

      expect(bitmapComputer.computeBitmap).toHaveBeenCalledTimes(1);
    });
  });

  describe('TTL expiry scenarios', () => {
    it('expired cache entry triggers revalidation', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const bitmap = Buffer.from([0x01]);
      cache.set('u1', { bitmap, permVersion: 5, cachedAt: now });

      // Within TTL → cache hit
      const cached = await service.getBitmap('u1', 5, Buffer.alloc(0));
      expect(cached).toEqual(bitmap);

      // Advance past TTL
      jest.spyOn(Date, 'now').mockReturnValue(now + 60_001);
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 5 });
      const jwtBitmap = Buffer.from([0x01]);

      const result = await service.getBitmap('u1', 5, jwtBitmap);
      expect(result).toEqual(jwtBitmap);
      // After TTL expired, it went to DB lookup
      expect(userRepo.findById).toHaveBeenCalledWith('u1');

      jest.restoreAllMocks();
    });
  });

  describe('User status blocking', () => {
    it.each(['INACTIVE', 'SUSPENDED', 'LOCKED'] as const)('%s user returns null and does not cache', async (status) => {
      userRepo.findById.mockResolvedValue({ status, permVersion: 5 });

      const result = await service.getBitmap('u1', 5, Buffer.alloc(0));
      expect(result).toBeNull();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
      expect(cache.get('u1')).toBeNull();
    });
  });

  describe('Error propagation', () => {
    it('computeBitmap failure propagates without corrupting cache', async () => {
      userRepo.findById.mockResolvedValue({ status: 'ACTIVE', permVersion: 10 });
      bitmapComputer.computeBitmap.mockRejectedValue(new Error('DB timeout'));

      await expect(service.getBitmap('u1', 5, Buffer.alloc(0))).rejects.toThrow('DB timeout');

      // Cache should not have stale/bad entry
      expect(cache.get('u1')).toBeNull();
    });

    it('userRepo.findById failure propagates', async () => {
      userRepo.findById.mockRejectedValue(new Error('Connection refused'));

      await expect(service.getBitmap('u1', 5, Buffer.alloc(0))).rejects.toThrow('Connection refused');
    });
  });

  describe('PermissionGuard + cache end-to-end', () => {
    it('guard uses cached bitmap across multiple requests', async () => {
      const epModel = { find: jest.fn() };
      const routeMapService = new RouteMapService(epModel as any);

      const mockSelectLean = (returnValue: any) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(returnValue),
      });

      epModel.find = jest.fn().mockReturnValue(mockSelectLean([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]));
      await routeMapService.reload();

      const bitmap = Buffer.from([0x01]);
      cache.set('u1', { bitmap, permVersion: 1, cachedAt: Date.now() });

      const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined), get: jest.fn().mockReturnValue(undefined) };
      const guard = new PermissionGuard(reflector as any, routeMapService, service);

      const user = { userId: 'u1', permVersion: 1, bitmap, isSuperadmin: false };

      // Multiple requests
      for (let i = 0; i < 3; i++) {
        const ctx = {
          switchToHttp: () => ({ getRequest: () => ({ method: 'GET', path: '/devices', user }) }),
          getHandler: () => jest.fn(),
          getClass: () => jest.fn(),
        } as any;

        const result = await guard.canActivate(ctx);
        expect(result).toBe(true);
      }

      // No DB lookups — all served from cache
      expect(userRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAll recovery', () => {
    it('invalidateAll clears all caches, next requests go to DB', async () => {
      cache.set('u1', { bitmap: Buffer.from([0x01]), permVersion: 1, cachedAt: Date.now() });
      cache.set('u2', { bitmap: Buffer.from([0x02]), permVersion: 1, cachedAt: Date.now() });

      cache.invalidateAll();

      userRepo.findById.mockImplementation((id: string) =>
        Promise.resolve({ status: 'ACTIVE', permVersion: 1 }),
      );

      // Both users need to go to DB now
      await service.getBitmap('u1', 1, Buffer.from([0x01]));
      await service.getBitmap('u2', 1, Buffer.from([0x02]));

      expect(userRepo.findById).toHaveBeenCalledWith('u1');
      expect(userRepo.findById).toHaveBeenCalledWith('u2');
    });
  });
});
