export interface CacheEntry {
  bitmap: Buffer;
  permVersion: number;
  isSuperadmin: boolean;
  cachedAt: number;
}

export interface IPermissionCacheService {
  get(userId: string): CacheEntry | null;
  set(userId: string, entry: CacheEntry): void;
  invalidate(userId: string): void;
  invalidateAll(): void;
}
