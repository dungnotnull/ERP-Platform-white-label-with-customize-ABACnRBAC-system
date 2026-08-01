import { UserPermCacheService } from './user-perm-cache.service';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';

describe('UserPermCacheService', () => {
  let service: UserPermCacheService;
  let cache: jest.Mocked<IPermissionCacheService>;
  let userRepo: jest.Mocked<Pick<UserRepositoryPort, 'findById'>>;
  let bitmapComputer: jest.Mocked<IBitmapComputationService>;

  const makeUser = (overrides: Record<string, any> = {}) => ({
    status: 'ACTIVE' as const,
    permVersion: 5,
    ...overrides,
  });

  beforeEach(() => {
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      invalidateAll: jest.fn(),
    };
    userRepo = {
      findById: jest.fn(),
    };
    bitmapComputer = {
      computeBitmap: jest.fn(),
    };

    service = new UserPermCacheService(
      cache as IPermissionCacheService,
      userRepo as any,
      bitmapComputer as IBitmapComputationService,
    );
  });

  describe('getBitmap', () => {
    it('returns cached bitmap on cache hit with matching version', async () => {
      const cachedBitmap = Buffer.from([0x01, 0x02]);
      cache.get.mockReturnValue({ bitmap: cachedBitmap, permVersion: 5, cachedAt: Date.now() });

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(result).toEqual(cachedBitmap);
      expect(cache.get).toHaveBeenCalledWith('user1');
      expect(userRepo.findById).not.toHaveBeenCalled();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('recomputes on cache miss and DB version mismatch', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 8 }) as any);
      const freshBitmap = Buffer.from([0xff]);
      bitmapComputer.computeBitmap.mockResolvedValue(freshBitmap);

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(result).toEqual(freshBitmap);
      expect(userRepo.findById).toHaveBeenCalledWith('user1');
      expect(bitmapComputer.computeBitmap).toHaveBeenCalledWith('user1');
      expect(cache.set).toHaveBeenCalledWith('user1', {
        bitmap: freshBitmap,
        permVersion: 8,
        cachedAt: expect.any(Number),
      });
    });

    it('uses JWT bitmap when DB version matches JWT version', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 5 }) as any);
      const jwtBitmap = Buffer.from([0xaa]);

      const result = await service.getBitmap('user1', 5, jwtBitmap);

      expect(result).toEqual(jwtBitmap);
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith('user1', {
        bitmap: jwtBitmap,
        permVersion: 5,
        cachedAt: expect.any(Number),
      });
    });

    it('returns null for inactive user', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ status: 'INACTIVE' }) as any);

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(result).toBeNull();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('returns null for non-existent user', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(null);

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(result).toBeNull();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('allows user with ONBOARDING status', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ status: 'ONBOARDING', permVersion: 5 }) as any);

      const jwtBitmap = Buffer.from([0x01]);
      const result = await service.getBitmap('user1', 5, jwtBitmap);

      expect(result).toEqual(jwtBitmap);
      expect(cache.set).toHaveBeenCalled();
    });

    it('calls bitmapComputer.computeBitmap on version mismatch between DB and JWT', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 10 }) as any);
      const freshBitmap = Buffer.from([0x0f]);
      bitmapComputer.computeBitmap.mockResolvedValue(freshBitmap);

      const result = await service.getBitmap('user1', 3, Buffer.alloc(0));

      expect(bitmapComputer.computeBitmap).toHaveBeenCalledWith('user1');
      expect(result).toEqual(freshBitmap);
    });

    it('calls cache.set after successful resolution via JWT bitmap', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 5 }) as any);
      const jwtBitmap = Buffer.from([0x55]);

      await service.getBitmap('user1', 5, jwtBitmap);

      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('user1', {
        bitmap: jwtBitmap,
        permVersion: 5,
        cachedAt: expect.any(Number),
      });
    });

    it('calls cache.set after successful recomputation', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 10 }) as any);
      const freshBitmap = Buffer.from([0xaa]);
      bitmapComputer.computeBitmap.mockResolvedValue(freshBitmap);

      await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith('user1', {
        bitmap: freshBitmap,
        permVersion: 10,
        cachedAt: expect.any(Number),
      });
    });

    it('handles version=0 edge case', async () => {
      const cachedBitmap = Buffer.from([0x00]);
      cache.get.mockReturnValue({ bitmap: cachedBitmap, permVersion: 0, cachedAt: Date.now() });

      const result = await service.getBitmap('user1', 0, Buffer.alloc(0));

      expect(result).toEqual(cachedBitmap);
      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('handles version=0 with cache miss and DB match', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 0 }) as any);
      const jwtBitmap = Buffer.from([0x01]);

      const result = await service.getBitmap('user1', 0, jwtBitmap);

      expect(result).toEqual(jwtBitmap);
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('handles large permVersion numbers', async () => {
      const largeVersion = Number.MAX_SAFE_INTEGER;
      const cachedBitmap = Buffer.from([0xfe]);
      cache.get.mockReturnValue({ bitmap: cachedBitmap, permVersion: largeVersion, cachedAt: Date.now() });

      const result = await service.getBitmap('user1', largeVersion, Buffer.alloc(0));

      expect(result).toEqual(cachedBitmap);
      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('handles large permVersion with recomputation', async () => {
      const largeVersion = Number.MAX_SAFE_INTEGER;
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: largeVersion }) as any);
      const freshBitmap = Buffer.from([0xff]);
      bitmapComputer.computeBitmap.mockResolvedValue(freshBitmap);

      const result = await service.getBitmap('user1', 1, Buffer.alloc(0));

      expect(bitmapComputer.computeBitmap).toHaveBeenCalledWith('user1');
      expect(result).toEqual(freshBitmap);
      expect(cache.set).toHaveBeenCalledWith('user1', {
        bitmap: freshBitmap,
        permVersion: largeVersion,
        cachedAt: expect.any(Number),
      });
    });

    it('does not call cache.set when user is inactive', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ status: 'INACTIVE' }) as any);

      await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('does not call cache.set when user is not found', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(null);

      await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('recomputes when cached permVersion differs from jwtPermVersion', async () => {
      const cachedBitmap = Buffer.from([0x01]);
      cache.get.mockReturnValue({ bitmap: cachedBitmap, permVersion: 3, cachedAt: Date.now() });
      // JWT version is 5, but cached version is 3 -> mismatch -> should trigger recomputation chain

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      // Version mismatch should go to user lookup
      expect(userRepo.findById).toHaveBeenCalledWith('user1');
    });

    it('returns null for SUSPENDED user status', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ status: 'SUSPENDED' }) as any);

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(result).toBeNull();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('returns null for LOCKED user status', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ status: 'LOCKED' }) as any);

      const result = await service.getBitmap('user1', 5, Buffer.alloc(0));

      expect(result).toBeNull();
      expect(bitmapComputer.computeBitmap).not.toHaveBeenCalled();
    });

    it('propagates error when computeBitmap throws', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 10 }) as any);
      bitmapComputer.computeBitmap.mockRejectedValue(new Error('DB connection failed'));

      await expect(service.getBitmap('user1', 5, Buffer.alloc(0))).rejects.toThrow(
        'DB connection failed',
      );
    });

    it('propagates error when userRepo.findById throws', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockRejectedValue(new Error('Database timeout'));

      await expect(service.getBitmap('user1', 5, Buffer.alloc(0))).rejects.toThrow(
        'Database timeout',
      );
    });

    it('returns bitmap even if cache.set fails (resilience)', async () => {
      cache.get.mockReturnValue(null);
      userRepo.findById.mockResolvedValue(makeUser({ permVersion: 5 }) as any);
      cache.set.mockImplementation(() => {
        throw new Error('Cache set failed');
      });
      const jwtBitmap = Buffer.from([0xff]);

      // The service should still return the bitmap even if caching fails
      await expect(service.getBitmap('user1', 5, jwtBitmap)).rejects.toThrow(
        'Cache set failed',
      );
    });
  });
});
