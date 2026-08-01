import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import _ from 'lodash';
import { Department, DepartmentDocument } from '../schemas/department.schema';
import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';
import {
  DepartmentLookupOptions,
  DepartmentRepositoryPort,
} from '@/domains/organization/application/ports/repositories/department.repository.port';
import { sanitizeSearchKeyword } from '@/shared/utils/sanitize-search-keyword.util';
import { withNotDeletedFilter } from '@/shared/utils/mongo-active-record-query.util';
import { User, UserDocument } from '@/domains/identity/infrastructure/persistence/schemas/user.schema';
import { Role, RoleDocument } from '@/domains/identity/infrastructure/persistence/schemas/role.schema';

@Injectable()
export class DepartmentRepository implements DepartmentRepositoryPort {
  constructor(
    @InjectModel(Department.name)
    private readonly model: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findById(id: string): Promise<DepartmentEntity | null> {
    if (!this.isValidObjectId(id)) {
      return null;
    }
    const doc = await this.model
      .findOne({ _id: id, ...this.notDeletedFilter() })
      .lean()
      .exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findActiveByCode(code: string): Promise<DepartmentEntity | null> {
    return this.findByCode(code, { includeDeleted: false });
  }

  async findActiveByName(name: string): Promise<DepartmentEntity | null> {
    return this.findByName(name, { includeDeleted: false });
  }

  async findByName(
    name: string,
    options?: DepartmentLookupOptions,
  ): Promise<DepartmentEntity | null> {
    const query = withNotDeletedFilter(
      { $or: [{ nameVi: name }, { nameJa: name }, { name }] },
      this.notDeletedFilter(),
      options?.includeDeleted,
    );

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findByCode(
    code: string,
    options?: DepartmentLookupOptions,
  ): Promise<DepartmentEntity | null> {
    const query: Record<string, unknown> = { code: code.toUpperCase() };
    if (!options?.includeDeleted) {
      Object.assign(query, this.notDeletedFilter());
    }

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findAll(search?: string): Promise<DepartmentEntity[]> {
    const filter: Record<string, unknown> = { ...this.notDeletedFilter() };
    const term = sanitizeSearchKeyword(search);
    if (!_.isEmpty(term)) {
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { nameVi: { $regex: term, $options: 'i' } },
        { nameJa: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
      ];
    }
    const docs = await this.model.find(filter).sort({ code: 1 }).lean().exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async findAllForOverview(): Promise<DepartmentEntity[]> {
    const docs = await this.model
      .find(this.notDeletedFilter())
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async findByIds(ids: string[]): Promise<DepartmentEntity[]> {
    const objectIds = [...new Set(ids)]
      .filter((id) => this.isValidObjectId(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return [];
    }

    const docs = await this.model
      .find({ _id: { $in: objectIds }, ...this.notDeletedFilter() })
      .select({ code: 1, nameVi: 1, nameJa: 1, name: 1, isDeleted: 1 })
      .lean()
      .exec();

    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async save(department: DepartmentEntity): Promise<DepartmentEntity> {
    const obj = {
      code: department.code,
      nameVi: department.nameVi,
      nameJa: department.nameJa,
      description: department.description,
      isDeleted: department.isDeleted ?? false,
    };
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(department.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate({ _id: department.id }, obj, { upsert: true, new: true })
        .lean()
        .exec();
      return this.toEntity(doc);
    }
    const doc = await this.model.create(obj);
    return this.toEntity(doc);
  }

  async findForExport(): Promise<DepartmentEntity[]> {
    const docs = await this.model
      .find(this.notDeletedFilter())
      .sort({ code: 1 })
      .lean()
      .exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  async removeFromAllUsers(departmentId: string): Promise<void> {
    await this.userModel.updateMany(
      { departmentIds: departmentId },
      { $pull: { departmentIds: departmentId } },
    );
  }

  async removeFromAllRoles(departmentId: string): Promise<void> {
    await this.roleModel.updateMany(
      { departmentIds: departmentId },
      { $pull: { departmentIds: departmentId } },
    );
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.isValidObjectId(id)) {
      return false;
    }
    const result = await this.model
      .updateOne({ _id: id }, { isDeleted: true })
      .exec();
    return result.modifiedCount > 0;
  }

  private notDeletedFilter(): Record<string, unknown> {
    return {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };
  }

  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  private toEntity(doc: LeanDepartment): DepartmentEntity {
    const legacyName = doc.name;
    const nameVi = doc.nameVi ?? legacyName ?? '';
    const nameJa = doc.nameJa ?? '';

    return new DepartmentEntity(String(doc._id), {
      code: doc.code,
      nameVi,
      nameJa,
      description: doc.description ?? '',
      isDeleted: doc.isDeleted ?? false,
    });
  }
}

type LeanDepartment = {
  _id: unknown;
  code: string;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  description?: string;
  isDeleted?: boolean;
};
