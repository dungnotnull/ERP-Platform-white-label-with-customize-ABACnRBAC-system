import { InProcessPermCache } from '@/domains/identity/application/services/in-process-perm-cache.service';

describe('Cache Invalidation Integration', () => {
  let cache: InProcessPermCache;

  beforeEach(() => {
    cache = new InProcessPermCache();
  });

  describe('Role change → permVersion bump → cache miss', () => {
    it('invalidate removes the cached entry for specific user', () => {
      cache.set('u1', { bitmap: Buffer.from([0xff]), permVersion: 5, cachedAt: Date.now() });
      expect(cache.get('u1')).not.toBeNull();

      cache.invalidate('u1');
      expect(cache.get('u1')).toBeNull();
    });

    it('invalidateAll removes all entries', () => {
      cache.set('u1', { bitmap: Buffer.from([0x01]), permVersion: 1, cachedAt: Date.now() });
      cache.set('u2', { bitmap: Buffer.from([0x02]), permVersion: 2, cachedAt: Date.now() });

      cache.invalidateAll();

      expect(cache.get('u1')).toBeNull();
      expect(cache.get('u2')).toBeNull();
    });
  });

  describe('TTL expiry', () => {
    it('entry expires after TTL (60_001ms)', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      cache.set('ttl-user', { bitmap: Buffer.from([0x01]), permVersion: 1, cachedAt: now });

      jest.spyOn(Date, 'now').mockReturnValue(now + 60_001);
      expect(cache.get('ttl-user')).toBeNull();

      jest.restoreAllMocks();
    });

    it('entry is still valid within TTL', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      cache.set('fresh', { bitmap: Buffer.from([0xff]), permVersion: 1, cachedAt: now });

      jest.spyOn(Date, 'now').mockReturnValue(now + 30_000);
      expect(cache.get('fresh')).not.toBeNull();

      jest.restoreAllMocks();
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when MAX_ENTRIES exceeded', () => {
      const MAX = 10_000;
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      for (let i = 0; i < MAX; i++) {
        cache.set(`user-${i}`, { bitmap: Buffer.from([i % 256]), permVersion: i, cachedAt: now });
      }

      expect(cache.get('user-0')).not.toBeNull();

      cache.set('overflow', { bitmap: Buffer.alloc(1), permVersion: 99999, cachedAt: now });

      expect(cache.get('user-0')).toBeNull();
      expect(cache.get('overflow')).not.toBeNull();

      jest.restoreAllMocks();
    });
  });

  describe('Cron cleanup', () => {
    it('removes expired entries but preserves fresh ones', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      cache.set('expired', { bitmap: Buffer.from([0x01]), permVersion: 1, cachedAt: now - 61_000 });
      cache.set('fresh', { bitmap: Buffer.from([0x02]), permVersion: 2, cachedAt: now - 10_000 });

      cache.cleanup();

      expect(cache.get('expired')).toBeNull();
      expect(cache.get('fresh')).not.toBeNull();

      jest.restoreAllMocks();
    });

    it('cleanup on empty cache does not throw', () => {
      expect(() => cache.cleanup()).not.toThrow();
    });
  });

  describe('Multi-user isolation', () => {
    it('different users do not interfere', () => {
      cache.set('u1', { bitmap: Buffer.from([0x01]), permVersion: 1, cachedAt: Date.now() });
      cache.set('u2', { bitmap: Buffer.from([0x02]), permVersion: 2, cachedAt: Date.now() });

      cache.invalidate('u1');

      expect(cache.get('u1')).toBeNull();
      expect(cache.get('u2')).not.toBeNull();
      expect(cache.get('u2')!.permVersion).toBe(2);
    });
  });

  describe('Cache re-insert after eviction', () => {
    it('entry can be re-cached after eviction', () => {
      const entry = { bitmap: Buffer.from([0x55]), permVersion: 1, cachedAt: Date.now() };
      cache.set('u1', entry);
      cache.invalidate('u1');
      cache.set('u1', entry);

      expect(cache.get('u1')).toEqual(entry);
    });
  });
});
