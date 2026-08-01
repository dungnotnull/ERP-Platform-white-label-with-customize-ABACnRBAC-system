import { RoleDocument } from '../schemas/role.schema';
import { RoleEntity } from '@/domains/identity/domain/entities/role.entity';
import { RoleStatusEnumType } from '@/shared/domain/enums/role.enum';

export class RoleMapper {
  public static toDomain(doc: RoleDocument): RoleEntity {
    return new RoleEntity(doc.id, {
      name: doc.name,
      displayName: doc.displayName || undefined,
      description: doc.description || undefined,
      endpointPermissionIds: doc.endpointPermissionIds?.map((id) => id.toString()) ?? [],
      isSystem: doc.isSystem ?? false,
      isActive: doc.isActive ?? true,
      status: doc.status as RoleStatusEnumType,
      departmentIds: doc.departmentIds?.map((id: any) => id.toString()) ?? [],
    });
  }

  public static toEntity(role: RoleEntity): Record<string, unknown> {
    return {
      name: role.name,
      displayName: role.displayName ?? '',
      description: role.description ?? '',
      endpointPermissionIds: role.endpointPermissionIds,
      isSystem: role.isSystem,
      isActive: role.isActive,
      status: role.status,
      departmentIds: role.departmentIds ?? [],
    };
  }
}
