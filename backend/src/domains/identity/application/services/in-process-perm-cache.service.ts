import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IPermissionCacheService, CacheEntry } from '@/domains/identity/application/ports/services/permission-cache.port';

@Injectable()
export class InProcessPermCache implements IPermissionCacheService {
  private readonly logger = new Logger(InProcessPermCache.name);
  private cache = new Map<string, CacheEntry>();

  private readonly TTL_MS = 60_000;
  private readonly MAX_ENTRIES = 10_000;

  get(userId: string): CacheEntry | null {
    const entry = this.cache.get(userId);

    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.TTL_MS) {
      this.cache.delete(userId);
      return null;
    }
    return entry;
  }

  set(userId: string, entry: CacheEntry): void {

    if (this.cache.size >= this.MAX_ENTRIES) {

      const firstKey = this.cache.keys().next().value;

      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.delete(userId);
    this.cache.set(userId, entry);

  }

  invalidate(userId: string): void {

    this.cache.delete(userId);
  }

  invalidateAll(): void {

    this.cache.clear();
  }

  @Cron('*/5 * * * *')
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.cachedAt > this.TTL_MS) {

        this.cache.delete(key);
      }
    }
  }
}
