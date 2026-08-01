import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import {
  UpdateEndpointPermissionInput,
  EndpointPermissionOutput,
} from '@/domains/identity/application/dtos/endpoint-permission.dtos';
import { EndpointPermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/endpoint-permission.repository.port';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { IPermissionCacheService } from '@/domains/identity/application/ports/services/permission-cache.port';
import { PermissionNotFoundException } from '@/domains/identity/domain/exceptions/permission-not-found.exception';
import { normalizeAndValidatePath, pathPatternToRegex } from '@/domains/identity/application/utils/endpoint-path.utils';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';

@Injectable()
export class UpdateEndpointPermissionUseCase
  implements IUseCase<UpdateEndpointPermissionInput, EndpointPermissionOutput> {
  constructor(
    @Inject('EndpointPermissionRepositoryPort') private readonly endpointPermissionRepository: EndpointPermissionRepositoryPort,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('IPermissionCacheService') private readonly cache: IPermissionCacheService,
    private readonly routeMapService: RouteMapService,
  ) { }

  async execute(
    input: UpdateEndpointPermissionInput,
  ): Promise<EndpointPermissionOutput> {
    const ep = await this.endpointPermissionRepository.findById(input.id);
    if (!ep) {
      throw new PermissionNotFoundException(input.id);
    }

    const method = input.method !== undefined ? input.method : ep.method;
    const moduleName = input.module !== undefined ? input.module : ep.module;
    const rawPathPattern = input.pathPattern !== undefined ? input.pathPattern : ep.pathPattern;
    const pathPattern = normalizeAndValidatePath(rawPathPattern);


    if (input.method !== undefined || input.module !== undefined || input.pathPattern !== undefined) {
      const existingEp = await this.endpointPermissionRepository.findByModuleMethodAndPathPattern(
        moduleName,
        method,
        pathPattern,
      );

      if (existingEp && existingEp.id !== input.id) {
        throw new ConflictException(`Endpoint permission with module ${moduleName}, method ${method} and path ${pathPattern} already exists`);
      }
    }

    const updateData: Partial<{
      method: string;
      pathPattern: string;
      module: string;
      permission: string;
      pathRegex: string;
      description: string;
    }> = {};

    if (input.method !== undefined) {
      updateData.method = input.method;
    }
    if (input.module !== undefined) {
      updateData.module = input.module;
    }
    if (input.permission !== undefined) {
      updateData.permission = input.permission;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.pathPattern !== undefined) {
      updateData.pathPattern = pathPattern;
      updateData.pathRegex = pathPatternToRegex(pathPattern);
    }

    ep.update(updateData);
    await this.endpointPermissionRepository.save(ep);

    await this.routeMapService.reload();

    // Bump permVersion and invalidate cache for all affected users
    const affectedUserIds = await this.endpointPermissionRepository.findUserIdsWithPermission(input.id);
    await Promise.all(
      affectedUserIds.map(uid => this.userRepository.bumpPermVersion(uid)),
    );
    for (const uid of affectedUserIds) {
      this.cache.invalidate(uid);
    }

    return {
      id: ep.id,
      method: ep.method,
      pathPattern: ep.pathPattern,
      module: ep.module,
      permission: ep.permission,
      bitIndex: ep.bitIndex,
      pathRegex: ep.pathRegex,
      isActive: ep.isActive,
      description: ep.description,
    };
  }
}
