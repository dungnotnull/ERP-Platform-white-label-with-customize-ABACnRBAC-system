import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '@/domains/identity/domain/entities/user.entity';
import {
  UserRepositoryPort,
  UserFilterInput,
  PaginatedResult,
} from '@/domains/identity/application/ports/repositories/user.repository.port';
import { UserDocument, User } from '../schemas/user.schema';
import { UserStatusEnumType, GenderEnumType, MaritalStatusEnumType } from '@/shared/domain/enums/user.enum';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) { }

  private toEntity(doc: UserDocument | any): UserEntity {
    const raw = doc as any;

    const normalizeIds = (ids: any[] | any): string[] => {
      if (!ids) return [];
      if (!Array.isArray(ids)) return [String(ids)];

      return ids
        .filter((id: any) => id != null)
        .map((id: any) => {
          if (typeof id === 'string') return id;
          if (id?.toString) return id.toString();
          return String(id);
        });
    };

    return UserEntity.create(raw.id || raw._id?.toString() || '', {
      name: raw.name,
      nickName: raw.nickName || undefined,
      bio: raw.bio || undefined,
      email: raw.email,
      password: raw.password,
      profilePicture: raw.profilePicture || undefined,
      status: raw.status as UserStatusEnumType,
      gender: (raw.gender as GenderEnumType) || undefined,
      maritalStatus: (raw.maritalStatus as MaritalStatusEnumType) || undefined,
      birthday: raw.birthday || undefined,
      address: raw.address || undefined,
      phone: raw.phone || undefined,

      roleIds: normalizeIds(raw.roleIds),
      departmentIds: normalizeIds(raw.departmentIds),

      permVersion: raw.permVersion ?? 1,
      isSuperadmin: raw.isSuperadmin ?? false,
      departmentId: raw.departmentId?.toString() ?? undefined,
      currentTeam: raw.currentTeam || undefined,
      onBoardingCompleted: raw.onBoardingCompleted ?? false,
      lastLogin: raw.lastLogin || undefined,
      createdBy: raw.createdBy || undefined,
      updatedBy: raw.updatedBy || undefined,
      visibleMenus: raw.visibleMenus || undefined,
    });
  }

  private toObject(entity: UserEntity): Record<string, any> {
    return {
      name: entity.name,
      nickName: entity.nickName,
      bio: entity.bio,
      email: entity.email,
      password: entity.password,
      profilePicture: entity.profilePicture,
      status: entity.status,
      gender: entity.gender,
      maritalStatus: entity.maritalStatus,
      birthday: entity.birthday,
      address: entity.address,
      phone: entity.phone,
      roleIds: entity.roleIds,
      permVersion: entity.permVersion,
      isSuperadmin: entity.isSuperadmin,
      departmentId: entity.departmentId,
      departmentIds: entity.departmentIds ?? [],
      currentTeam: entity.currentTeam,
      onBoardingCompleted: entity.onBoardingCompleted,
      lastLogin: entity.lastLogin,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      visibleMenus: entity.visibleMenus,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.model.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await this.model.findOne({ email: email.toLowerCase() }).select('+password');
    return doc ? this.toEntity(doc) : null;
  }

  async findPaginated(
    filter: UserFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<UserEntity>> {
    const query: Record<string, any> = {};

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { nickName: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.roleId) {
      query.roleIds = { $in: [filter.roleId] };
    }

    if (filter.departmentId) {
      query.departmentIds = { $in: [filter.departmentId] }
    }

    const [docs, total] = await Promise.all([
      this.model
        .find(query).lean()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.model.countDocuments(query),
    ]);

    return {
      items: docs.map((doc) => this.toEntity(doc)),
      total,
      page,
      limit,
    };
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(user.id);
    if (isObjectId) {
      const doc = await this.model.findOneAndUpdate(
        { _id: user.id },
        this.toObject(user),
        { upsert: true, new: true },
      );
      return this.toEntity(doc);
    }

    const doc = await this.model.create(this.toObject(user));
    return this.toEntity(doc);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async bumpPermVersion(userId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, { $inc: { permVersion: 1 } });
  }

  async findByRoleId(roleId: string): Promise<UserEntity[]> {
    const docs = await this.model.find({ roleIds: roleId }).lean();
    return docs.map((doc) => this.toEntity(doc));
  }
}
