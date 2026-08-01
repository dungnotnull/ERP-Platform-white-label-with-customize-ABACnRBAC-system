import { PaginatedResult } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RoleEntity } from '@/domains/identity/domain/entities/role.entity';
import {
  RoleRepositoryPort,
} from '@/domains/identity/application/ports/repositories/role.repository.port';
import { RoleDocument, Role } from '../schemas/role.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class RoleRepository implements RoleRepositoryPort {
  constructor(
    @InjectModel(Role.name) private readonly model: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toEntity(doc: RoleDocument | any): RoleEntity {
    const raw = doc as any;
    return new RoleEntity(raw.id || raw._id?.toString() || '', {
      name: raw.name,
      displayName: raw.displayName || undefined,
      description: raw.description || undefined,
      endpointPermissionIds: raw.endpointPermissionIds?.map((id: any) => id.toString()) ?? [],
      isSystem: raw.isSystem ?? false,
      isActive: raw.isActive ?? true,
      status: raw.status,
      departmentIds: raw.departmentIds?.map((id: any) => id.toString()) ?? [],
    });
  }

  private toObject(entity: RoleEntity): Record<string, any> {
    return {
      name: entity.name,
      displayName: entity.displayName ?? '',
      description: entity.description ?? '',
      endpointPermissionIds: entity.endpointPermissionIds,
      isSystem: entity.isSystem,
      isActive: entity.isActive,
      status: entity.status,
      departmentIds: entity.departmentIds ?? [],
    };
  }

  async findById(id: string): Promise<RoleEntity | null> {
    const doc = await this.model.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByIds(ids: string[]): Promise<RoleEntity[]> {
    const docs = await this.model.find({ _id: { $in: ids } });
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const doc = await this.model.findOne({ name });
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<RoleEntity>> {
    const [docs, total] = await Promise.all([
      this.model
        .find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.model.countDocuments(),
    ]);

    return {
      items: docs.map((doc) => this.toEntity(doc)),
      total,
      page,
      limit,
    };
  }

  async save(role: RoleEntity): Promise<RoleEntity> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(role.id);
    if (isObjectId) {
      const doc = await this.model.findOneAndUpdate(
        { _id: role.id },
        this.toObject(role),
        { upsert: true, new: true },
      );
      return this.toEntity(doc);
    }
    const doc = await this.model.create(this.toObject(role));
    return this.toEntity(doc);
  }

  async findByIdsWithActive(roleIds: string[]): Promise<RoleEntity[]> {
    const docs = await this.model.find({ _id: { $in: roleIds }, isActive: true });
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByDepartmentIds(departmentIds: string[]): Promise<RoleEntity[]> {
    const docs = await this.model.find({
      departmentIds: { $in: departmentIds },
    });
    return docs.map((doc) => this.toEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    return this.userModel.countDocuments({ roleIds: roleId });
  }

  async removeFromAllUsers(roleId: string): Promise<void> {
    await this.userModel.updateMany(
      { roleIds: roleId },
      { $pull: { roleIds: roleId } },
    );
  }
}
