import { PaginatedResult } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PermissionEntity } from '@/domains/identity/domain/entities/permission.entity';
import {
  PermissionRepositoryPort,
} from '@/domains/identity/application/ports/repositories/permission.repository.port';
import { PermissionDocument, Permission } from '../schemas/permission.schema';

@Injectable()
export class PermissionRepository implements PermissionRepositoryPort {
  constructor(
    @InjectModel(Permission.name) private readonly model: Model<PermissionDocument>,
  ) {}

  private toEntity(doc: PermissionDocument): PermissionEntity {
    return new PermissionEntity(doc.id || doc._id.toString(), {
      name: doc.name,
      description: doc.description,
      status: doc.status as any,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
    });
  }

  private toObject(entity: PermissionEntity): Record<string, any> {
    return {
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
    };
  }

  async findById(id: string): Promise<PermissionEntity | null> {
    const doc = await this.model.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByIds(ids: string[]): Promise<PermissionEntity[]> {
    const docs = await this.model.find({ _id: { $in: ids } });
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByName(name: string): Promise<PermissionEntity | null> {
    const doc = await this.model.findOne({ name });
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(
    page: number,
    limit: number,
    status?: string,
  ): Promise<PaginatedResult<PermissionEntity>> {
    const query: Record<string, any> = {};
    if (status) {
      query.status = status;
    }

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
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

  async save(permission: PermissionEntity): Promise<PermissionEntity> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(permission.id);
    if (isObjectId) {
      const doc = await this.model.findOneAndUpdate(
        { _id: permission.id },
        this.toObject(permission),
        { upsert: true, new: true },
      );
      return this.toEntity(doc);
    }
    const doc = await this.model.create(this.toObject(permission));
    return this.toEntity(doc);
  }
}
