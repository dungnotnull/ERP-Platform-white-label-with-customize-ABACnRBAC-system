import { Injectable, Logger, Inject } from '@nestjs/common';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';

export interface PermResolveResult {
  bitmap: Buffer | null;
  isSuperadmin: boolean;
}

@Injectable()
export class UserPermCacheService {
  private readonly logger = new Logger(UserPermCacheService.name);

  constructor(
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
    @Inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @Inject('IBitmapComputationService') private readonly bitmapComputer: IBitmapComputationService,
  ) { }

  async resolvePermissions(
    userId: string,
    jwtPermVersion: number,
    jwtBitmap: Buffer,
    jwtIsSuperadmin: boolean,
  ): Promise<PermResolveResult> {

    const cached = this.cache.get(userId);

    if (cached && cached.permVersion === jwtPermVersion) {
      return { bitmap: cached.bitmap, isSuperadmin: cached.isSuperadmin };
    }

    const user = await this.userRepo.findById(userId);

    if (!user || (user.status !== 'ACTIVE' && user.status !== 'ONBOARDING')) {
      return { bitmap: null, isSuperadmin: false };
    }

    const dbIsSuperadmin = user.isSuperadmin;

    if (user.permVersion === jwtPermVersion) {
      this.cache.set(userId, { bitmap: jwtBitmap, permVersion: jwtPermVersion, isSuperadmin: dbIsSuperadmin, cachedAt: Date.now() });
      return { bitmap: jwtBitmap, isSuperadmin: dbIsSuperadmin };
    }

    this.logger.log(`Permission version mismatch for user ${userId}, recomputing bitmap`);
    const freshBitmap = await this.bitmapComputer.computeBitmap(userId);

    this.cache.set(userId, { bitmap: freshBitmap, permVersion: user.permVersion, isSuperadmin: dbIsSuperadmin, cachedAt: Date.now() });
    return { bitmap: freshBitmap, isSuperadmin: dbIsSuperadmin };
  }
}
