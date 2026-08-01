import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PermissionNotFoundException } from '@/domains/identity/domain/exceptions/permission-not-found.exception';
import { EndpointPermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/endpoint-permission.repository.port';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';

export interface DeleteEndpointPermissionInput {
  id: string;
  forceHard?: boolean;
}

@Injectable()
export class DeleteEndpointPermissionUseCase implements IUseCase<DeleteEndpointPermissionInput, void> {
  constructor(
    @Inject('EndpointPermissionRepositoryPort') private readonly endpointPermissionRepository: EndpointPermissionRepositoryPort,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
    private readonly routeMapService: RouteMapService,
  ) {}

  async execute(input: DeleteEndpointPermissionInput): Promise<void> {
    const ep = await this.endpointPermissionRepository.findById(input.id);
    if (!ep) {
      throw new PermissionNotFoundException(input.id);
    }

    if (input.forceHard === true) {
      await this.endpointPermissionRepository.removeFromAllRoles(input.id);
      await this.endpointPermissionRepository.delete(input.id);
    } else {
      ep.update({ isActive: false });
      await this.endpointPermissionRepository.save(ep);
    }

    await this.routeMapService.reload();

    const affectedUserIds = await this.endpointPermissionRepository.findUserIdsWithPermission(input.id);
    await Promise.all([
      ...affectedUserIds.map(uid => this.userRepository.bumpPermVersion(uid)),
    ]);
    for (const uid of affectedUserIds) {
      this.cache.invalidate(uid);
    }
  }
}
