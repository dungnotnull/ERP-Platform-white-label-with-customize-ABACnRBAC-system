import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { EndpointPermissionOutput } from '@/domains/identity/application/dtos/endpoint-permission.dtos';
import { EndpointPermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/endpoint-permission.repository.port';

export interface MatchEndpointInput {
  method: string;
  path: string;
}

@Injectable()
export class MatchEndpointPermissionUseCase implements IUseCase<MatchEndpointInput, EndpointPermissionOutput[]> {
  constructor(
    @Inject('EndpointPermissionRepositoryPort') private readonly endpointPermissionRepository: EndpointPermissionRepositoryPort,
  ) {}

  async execute(input: MatchEndpointInput): Promise<EndpointPermissionOutput[]> {
    const allResult = await this.endpointPermissionRepository.findAll(1, 1000);
    const matching = allResult.items.filter((ep) => {
      if (ep.method !== input.method) {
        return false;
      }
      return this.pathMatches(ep.pathPattern, input.path);
    });

    return matching.map((ep) => ({
      id: ep.id,
      method: ep.method,
      pathPattern: ep.pathPattern,
      module: ep.module,
      permission: ep.permission,
      bitIndex: ep.bitIndex,
      isActive: ep.isActive,
      description: ep.description,
    }));
  }

  private pathMatches(pattern: string, path: string): boolean {
    const regexStr = pattern
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\//g, '\\/')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(path);
  }
}
