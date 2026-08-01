import { PaginatedResult } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EndpointPermissionEntity } from '@/domains/identity/domain/entities/endpoint-permission.entity';
import {
  EndpointPermissionRepositoryPort,
  EndpointPermissionFilterInput,
} from '@/domains/identity/application/ports/repositories/endpoint-permission.repository.port';
import { EndpointPermissionDocument, EndpointPermission } from '../schemas/endpoint-permission.schema';
import { SystemCounter, SystemCounterDocument } from '../schemas/system-counter.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class EndpointPermissionRepository implements EndpointPermissionRepositoryPort {
  constructor(
    @InjectModel(EndpointPermission.name) private readonly model: Model<EndpointPermissionDocument>,
    @InjectModel(SystemCounter.name) private readonly systemCounterModel: Model<SystemCounterDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toEntity(doc: EndpointPermissionDocument | ReturnType<InstanceType<typeof Model<EndpointPermission>>['toJSON']>): EndpointPermissionEntity {
    const raw = doc as any;
    return new EndpointPermissionEntity(raw.id || raw._id?.toString() || '', {
      method: raw.method,
      pathPattern: raw.pathPattern,
      module: raw.module,
      permission: raw.permission,
      bitIndex: raw.bitIndex,
      pathRegex: raw.pathRegex || undefined,
      isActive: raw.isActive ?? true,
      description: raw.description || undefined,
    });
  }

  private toObject(entity: EndpointPermissionEntity): Record<string, any> {
    return {
      method: entity.method,
      pathPattern: entity.pathPattern,
      module: entity.module,
      permission: entity.permission,
      bitIndex: entity.bitIndex,
      pathRegex: entity.pathRegex ?? '',
      isActive: entity.isActive,
      description: entity.description ?? '',
    };
  }

  async findAll(
    page: number,
    limit: number,
    filter?: EndpointPermissionFilterInput,
  ): Promise<PaginatedResult<EndpointPermissionEntity>> {
    const query: Record<string, any> = { isActive: true };

    if (filter?.module) {
      query.module = filter.module;
    }
    if (filter?.method) {
      query.method = filter.method;
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

  async save(ep: EndpointPermissionEntity): Promise<EndpointPermissionEntity> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(ep.id);
    if (isObjectId) {
      const doc = await this.model.findOneAndUpdate(
        { _id: ep.id },
        this.toObject(ep),
        { upsert: true, new: true },
      );
      return this.toEntity(doc);
    }
    const doc = await this.model.create(this.toObject(ep));
    return this.toEntity(doc);
  }

  async findById(id: string): Promise<EndpointPermissionEntity | null> {
    const doc = await this.model.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByModuleMethodAndPathPattern(module: string, method: string, pathPattern: string): Promise<EndpointPermissionEntity | null> {
    const doc = await this.model.findOne({ module, method, pathPattern });
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  async findAllActive(): Promise<EndpointPermissionEntity[]> {
    const docs = await this.model.find({ isActive: true });
    return docs.map((doc) => this.toEntity(doc));
  }

  async nextBitIndex(): Promise<number> {
    const counter = await this.systemCounterModel.findOneAndUpdate(
      { key: 'endpoint_permission_bit_index' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return counter.seq - 1;
  }

  async removeFromAllRoles(permissionId: string): Promise<void> {
    await this.roleModel.updateMany(
      { endpointPermissionIds: permissionId },
      { $pull: { endpointPermissionIds: permissionId } },
    );
  }

  async findUserIdsWithPermission(epId: string): Promise<string[]> {
    const roles = await this.roleModel.find({ endpointPermissionIds: epId, isActive: true }).select('_id').lean();
    const roleIds = roles.map(r => r._id);
    if (!roleIds.length) return [];

    const users = await this.userModel.find({ roleIds: { $in: roleIds } }).select('_id').lean();
    return users.map(u => u._id.toString());
  }
}
