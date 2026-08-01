import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateEndpointPermissionInput, EndpointPermissionOutput } from '@/domains/identity/application/dtos/endpoint-permission.dtos';
import { EndpointPermissionEntity } from '@/domains/identity/domain/entities/endpoint-permission.entity';
import { EndpointPermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/endpoint-permission.repository.port';
import { normalizeAndValidatePath, pathPatternToRegex } from '@/domains/identity/application/utils/endpoint-path.utils';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';

@Injectable()
export class CreateEndpointPermissionUseCase implements IUseCase<CreateEndpointPermissionInput, EndpointPermissionOutput> {
  constructor(
    @Inject('EndpointPermissionRepositoryPort') private readonly endpointPermissionRepository: EndpointPermissionRepositoryPort,
    private readonly routeMapService: RouteMapService,
  ) {}

  async execute(input: CreateEndpointPermissionInput): Promise<EndpointPermissionOutput> {
    const normalizedPath = normalizeAndValidatePath(input.pathPattern);

    const existingEp = await this.endpointPermissionRepository.findByModuleMethodAndPathPattern(
      input.module,
      input.method,
      normalizedPath,
    );

    if (existingEp) {
      throw new ConflictException(`Endpoint permission with module ${input.module}, method ${input.method} and path ${input.pathPattern} already exists`);
    }

    const bitIndex = await this.endpointPermissionRepository.nextBitIndex();
    const pathRegex = pathPatternToRegex(normalizedPath);

    const ep = new EndpointPermissionEntity('', {
      method: input.method,
      pathPattern: normalizedPath,
      module: input.module,
      permission: input.permission,
      bitIndex,
      pathRegex,
      isActive: true,
      description: input.description,
    });

    const saved = await this.endpointPermissionRepository.save(ep);

    await this.routeMapService.reload();

    return {
      id: saved.id,
      method: saved.method,
      pathPattern: saved.pathPattern,
      module: saved.module,
      permission: saved.permission,
      bitIndex: saved.bitIndex,
      pathRegex: saved.pathRegex,
      isActive: saved.isActive,
      description: saved.description,
    };
  }
}
