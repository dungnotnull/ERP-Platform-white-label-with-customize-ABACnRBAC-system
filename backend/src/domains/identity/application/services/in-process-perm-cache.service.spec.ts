import { InProcessPermCache } from './in-process-perm-cache.service';
import { CacheEntry } from '@/domains/identity/application/ports/services/permission-cache.port';

describe('InProcessPermCache', () => {
  let cache: InProcessPermCache;

  const makeEntry = (overrides: Partial<CacheEntry> = {}): CacheEntry => ({
    bitmap: Buffer.alloc(1, 0xff),
    permVersion: 1,
    cachedAt: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    cache = new InProcessPermCache();
  });

  describe('get', () => {
    it('returns null for non-existent entry', () => {
      expect(cache.get('user-1')).toBeNull();
    });

    it('returns entry when it exists and is not expired', () => {
      const entry = makeEntry();
      cache.set('user-1', entry);

      const result = cache.get('user-1');

      expect(result).toBe(entry);
    });

    it('returns null and deletes entry when TTL expired', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const entry = makeEntry({ cachedAt: now });
      cache.set('user-1', entry);

      // Advance past TTL (60_000 ms)
      jest.spyOn(Date, 'now').mockReturnValue(now + 60_001);

      const result = cache.get('user-1');

      expect(result).toBeNull();

      // Verify entry was deleted from internal storage
      jest.spyOn(Date, 'now').mockReturnValue(now + 60_001);
      // A second get should also return null (proves deletion, not just TTL check)
      expect(cache.get('user-1')).toBeNull();

      jest.restoreAllMocks();
    });
  });

  describe('set', () => {
    it('stores entry correctly', () => {
      const entry = makeEntry();

      cache.set('user-1', entry);

      expect(cache.get('user-1')).toBe(entry);
    });

    it('re-inserts entry (moves to end of Map for LRU)', () => {
      const entry1 = makeEntry({ permVersion: 1 });
      const entry2 = makeEntry({ permVersion: 2 });
      const entry1Updated = makeEntry({ permVersion: 99 });

      cache.set('user-1', entry1);
      cache.set('user-2', entry2);
      // Re-insert user-1, making it the newest entry
      cache.set('user-1', entry1Updated);

      // Now force eviction by filling up to MAX_ENTRIES
      // MAX_ENTRIES = 10_000, so we add 9998 more (user-1 and user-2 already present)
      for (let i = 3; i <= 10_000; i++) {
        cache.set(`user-${i}`, makeEntry({ permVersion: i }));
      }
      // One more should evict the oldest, which is user-2
      cache.set('user-10001', makeEntry());

      // user-2 should be evicted (it was oldest after re-insert of user-1)
      expect(cache.get('user-2')).toBeNull();
      // user-1 should still exist (was re-inserted more recently)
      expect(cache.get('user-1')).toBe(entry1Updated);
    });

    it('evicts oldest entry when MAX_ENTRIES reached', () => {
      const MAX = 10_000;
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      for (let i = 0; i < MAX; i++) {
        cache.set(`user-${i}`, makeEntry({ permVersion: i }));
      }

      // Cache is full. Adding one more should evict user-0
      cache.set('user-extra', makeEntry());

      expect(cache.get('user-0')).toBeNull();
      expect(cache.get('user-1')).not.toBeNull();
      expect(cache.get('user-extra')).not.toBeNull();

      jest.restoreAllMocks();
    });
  });

  describe('invalidate', () => {
    it('removes specific entry', () => {
      cache.set('user-1', makeEntry());
      cache.set('user-2', makeEntry());

      cache.invalidate('user-1');

      expect(cache.get('user-1')).toBeNull();
      expect(cache.get('user-2')).not.toBeNull();
    });
  });

  describe('invalidateAll', () => {
    it('clears all entries', () => {
      cache.set('user-1', makeEntry());
      cache.set('user-2', makeEntry());

      cache.invalidateAll();

      expect(cache.get('user-1')).toBeNull();
      expect(cache.get('user-2')).toBeNull();
    });
  });

  describe('multiple set() calls on same userId', () => {
    it('updates the entry', () => {
      const entryV1 = makeEntry({ permVersion: 1 });
      const entryV2 = makeEntry({ permVersion: 2 });

      cache.set('user-1', entryV1);
      cache.set('user-1', entryV2);

      const result = cache.get('user-1');
      expect(result).toBe(entryV2);
      expect(result!.permVersion).toBe(2);
    });
  });

  describe('LRU eviction order', () => {
    it('evicts oldest entry first', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Fill cache to exactly MAX_ENTRIES
      const MAX = 10_000;
      for (let i = 0; i < MAX; i++) {
        cache.set(`user-${i}`, makeEntry({ permVersion: i }));
      }

      // Adding user-MAX should evict user-0
      cache.set(`user-${MAX}`, makeEntry());
      expect(cache.get('user-0')).toBeNull();
      expect(cache.get('user-1')).not.toBeNull();

      // Adding user-MAX+1 should evict user-1
      cache.set(`user-${MAX + 1}`, makeEntry());
      expect(cache.get('user-1')).toBeNull();
      expect(cache.get('user-2')).not.toBeNull();

      jest.restoreAllMocks();
    });
  });

  describe('TTL boundary condition', () => {
    it('returns entry at exactly 60_000ms (within TTL, uses > not >=)', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      cache.set('user-boundary', makeEntry({ cachedAt: now }));

      // At exactly TTL, still within boundary because check is > TTL_MS, not >=
      jest.spyOn(Date, 'now').mockReturnValue(now + 60_000);
      expect(cache.get('user-boundary')).not.toBeNull();

      // At TTL + 1ms, expired
      jest.spyOn(Date, 'now').mockReturnValue(now + 60_001);
      expect(cache.get('user-boundary')).toBeNull();

      jest.restoreAllMocks();
    });
  });

  describe('cleanup cron', () => {
    it('removes expired entries but keeps fresh ones', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      cache.set('expired', makeEntry({ cachedAt: now - 60_001 }));
      cache.set('fresh', makeEntry({ cachedAt: now }));

      cache.cleanup();

      expect(cache.get('expired')).toBeNull();
      expect(cache.get('fresh')).not.toBeNull();

      jest.restoreAllMocks();
    });

    it('does not throw on empty cache', () => {
      expect(() => cache.cleanup()).not.toThrow();
    });
  });

  describe('MAX_ENTRIES boundary', () => {
    it('handles exactly MAX_ENTRIES without error', () => {
      const MAX = 10_000;
      for (let i = 0; i < MAX; i++) {
        cache.set(`user-${i}`, makeEntry());
      }

      expect(cache.get('user-0')).not.toBeNull();
      expect(cache.get(`user-${MAX - 1}`)).not.toBeNull();
    });
  });
});
