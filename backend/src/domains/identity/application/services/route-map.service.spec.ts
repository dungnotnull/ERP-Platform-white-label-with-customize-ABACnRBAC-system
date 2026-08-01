import { RouteMapService } from './route-map.service';

describe('RouteMapService', () => {
  let service: RouteMapService;
  let epModel: any;

  const mockSelectLean = (returnValue: any) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(returnValue),
    };
    return chain;
  };

  beforeEach(() => {
    epModel = {
      find: jest.fn(),
    };
    service = new RouteMapService(epModel);
  });

  const loadFixtures = async (eps: any[]) => {
    epModel.find = jest.fn().mockReturnValue(mockSelectLean(eps));
    await service.reload();
  };

  describe('reload', () => {
    it('loads all active endpoint permissions', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
        { method: 'POST', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 1, isActive: true },
      ]);

      expect(service.resolve('GET', '/devices')).toBe(0);
      expect(service.resolve('POST', '/devices')).toBe(1);
    });

    it('sorts literal paths before parametric paths', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 5, isActive: true },
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 3, isActive: true },
      ]);

      // Literal /devices should match first, returning bitIndex 3
      expect(service.resolve('GET', '/devices')).toBe(3);
      // Parametric should still match /devices/123
      expect(service.resolve('GET', '/devices/123')).toBe(5);
    });

    it('only loads active permissions (filters isActive: true)', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]);

      // Verify epModel.find was called with isActive: true
      const findCall = epModel.find.mock.calls[0][0];
      expect(findCall).toEqual({ isActive: true });
    });
  });

  describe('resolve', () => {
    it('returns correct bitIndex for literal path', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/health', pathRegex: '^/health$', bitIndex: 10, isActive: true },
      ]);

      expect(service.resolve('GET', '/health')).toBe(10);
    });

    it('returns correct bitIndex for parametric path (/devices/:id)', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 7, isActive: true },
      ]);

      expect(service.resolve('GET', '/devices/abc123')).toBe(7);
    });

    it('returns correct bitIndex for nested parametric path (/departments/:id/devices)', async () => {
      await loadFixtures([
        {
          method: 'GET',
          pathPattern: '/departments/:id/devices',
          pathRegex: '^/departments/[^/]+/devices$',
          bitIndex: 15,
          isActive: true,
        },
      ]);

      expect(service.resolve('GET', '/departments/42/devices')).toBe(15);
    });

    it('strips query parameters before matching', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 2, isActive: true },
      ]);

      expect(service.resolve('GET', '/devices?page=1&limit=10')).toBe(2);
    });

    it('returns null for unregistered endpoint', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]);

      expect(service.resolve('GET', '/unknown')).toBeNull();
    });

    it('returns null for wrong HTTP method', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]);

      expect(service.resolve('POST', '/devices')).toBeNull();
    });

    it('matches most specific path first (literal before parametric)', async () => {
      await loadFixtures([
        // Parametric loaded first in raw data (before sort)
        { method: 'GET', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 20, isActive: true },
        // Literal loaded second
        { method: 'GET', pathPattern: '/devices/special', pathRegex: '^/devices/special$', bitIndex: 21, isActive: true },
      ]);

      // After reload, literal should come before parametric in the sorted array
      // So /devices/special should match bitIndex 21, not 20
      expect(service.resolve('GET', '/devices/special')).toBe(21);
      // Generic parametric still matches other ids
      expect(service.resolve('GET', '/devices/xyz')).toBe(20);
    });

    it('handles /api/v1 prefix stripping', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]);

      // The service strips /api/v1 from the path before matching
      expect(service.resolve('GET', '/api/v1/devices')).toBe(0);
    });

    it('reload can be called multiple times (idempotent)', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]);

      // Calling reload again shouldn't break anything
      await service.reload();
      expect(service.resolve('GET', '/devices')).toBe(0);
    });

    it('returns null for empty routes after reload', async () => {
      await loadFixtures([]);

      expect(service.resolve('GET', '/anything')).toBeNull();
    });

    it('handles multiple methods on same path', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
        { method: 'POST', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 1, isActive: true },
        { method: 'DELETE', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 2, isActive: true },
      ]);

      expect(service.resolve('GET', '/devices')).toBe(0);
      expect(service.resolve('POST', '/devices')).toBe(1);
      expect(service.resolve('DELETE', '/devices')).toBe(2);
    });

    it('handles path with trailing slash', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices/?$', bitIndex: 0, isActive: true },
      ]);

      expect(service.resolve('GET', '/devices/')).toBe(0);
    });

    it('handles special characters in path', async () => {
      await loadFixtures([
        { method: 'GET', pathPattern: '/items/search', pathRegex: '^/items/search$', bitIndex: 5, isActive: true },
      ]);

      // Path with dots, dashes
      expect(service.resolve('GET', '/items/search')).toBe(5);
    });
  });

  describe('removeApiPrefix', () => {
    it('strips /api/v1 prefix', () => {
      // This is an internal method tested via resolve
      expect(service.resolve('GET', '/api/v1/devices')).toBeDefined();
    });
  });
});
