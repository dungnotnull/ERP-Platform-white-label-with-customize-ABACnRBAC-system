import { EndpointPermissionDocument } from '../schemas/endpoint-permission.schema';
import { EndpointPermissionEntity } from '@/domains/identity/domain/entities/endpoint-permission.entity';

export class EndpointPermissionMapper {
  public static toDomain(doc: EndpointPermissionDocument): EndpointPermissionEntity {
    return new EndpointPermissionEntity(doc.id, {
      method: doc.method,
      pathPattern: doc.pathPattern,
      module: doc.module,
      permission: doc.permission,
      bitIndex: doc.bitIndex,
      pathRegex: doc.pathRegex || undefined,
      isActive: doc.isActive ?? true,
      description: doc.description || undefined,
    });
  }

  public static toEntity(endpointPermission: EndpointPermissionEntity): Record<string, unknown> {
    return {
      method: endpointPermission.method,
      pathPattern: endpointPermission.pathPattern,
      module: endpointPermission.module,
      permission: endpointPermission.permission,
      bitIndex: endpointPermission.bitIndex,
      pathRegex: endpointPermission.pathRegex ?? '',
      isActive: endpointPermission.isActive,
      description: endpointPermission.description ?? '',
    };
  }
}
