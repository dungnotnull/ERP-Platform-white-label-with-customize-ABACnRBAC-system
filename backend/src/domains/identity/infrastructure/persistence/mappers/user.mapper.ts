import { UserDocument } from '../schemas/user.schema';
import { UserEntity } from '@/domains/identity/domain/entities/user.entity';
import { UserStatusEnumType, GenderEnumType, MaritalStatusEnumType } from '@/shared/domain/enums/user.enum';

export class UserMapper {
  public static toDomain(doc: UserDocument): UserEntity {
    return UserEntity.create(doc.id, {
      name: doc.name,
      nickName: doc.nickName || undefined,
      bio: doc.bio || undefined,
      email: doc.email,
      password: doc.password,
      profilePicture: doc.profilePicture || undefined,
      status: doc.status as UserStatusEnumType,
      gender: (doc.gender as GenderEnumType) || undefined,
      maritalStatus: (doc.maritalStatus as MaritalStatusEnumType) || undefined,
      birthday: doc.birthday || undefined,
      address: doc.address || undefined,
      phone: doc.phone || undefined,
      roleIds: doc.roleIds?.map((id) => id.toString()) ?? [],
      permVersion: doc.permVersion ?? 1,
      isSuperadmin: doc.isSuperadmin ?? false,
      departmentId: doc.departmentId?.toString() ?? undefined,
      departmentIds: doc.departmentIds?.map((id: any) => id.toString()) ?? [],
      currentTeam: doc.currentTeam || undefined,
      onBoardingCompleted: doc.onBoardingCompleted ?? false,
      lastLogin: doc.lastLogin || undefined,
      createdBy: doc.createdBy || undefined,
      updatedBy: doc.updatedBy || undefined,
    });
  }

  public static toEntity(user: UserEntity): Record<string, unknown> {
    return {
      name: user.name,
      nickName: user.nickName ?? '',
      bio: user.bio ?? '',
      email: user.email,
      password: user.password,
      profilePicture: user.profilePicture ?? null,
      status: user.status,
      gender: user.gender ?? null,
      maritalStatus: user.maritalStatus ?? null,
      birthday: user.birthday ?? null,
      address: user.address ?? '',
      phone: user.phone ?? '',
      roleIds: user.roleIds,
      isSuperadmin: user.isSuperadmin,
      permVersion: user.permVersion,
      departmentId: user.departmentId ?? null,
      departmentIds: user.departmentIds ?? [],
      currentTeam: user.currentTeam ?? null,
      onBoardingCompleted: user.onBoardingCompleted,
      lastLogin: user.lastLogin,
      createdBy: user.createdBy ?? '',
      updatedBy: user.updatedBy ?? '',
    };
  }
}
