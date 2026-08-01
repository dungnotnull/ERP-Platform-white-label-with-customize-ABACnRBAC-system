import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import _ from 'lodash';
import { InternalUser, InternalUserDocument } from '../schemas/internal-user.schema';
import { InternalUserEntity } from '@/domains/organization/domain/entities/internal-user.entity';
import {
  InternalUserRepositoryPort,
  InternalUserFilterInput,
  InternalUserLookupOptions,
  InternalUserOverviewRow,
} from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { PaginatedResult } from '@/domains/organization/application/ports/repositories/department.repository.port';
import {
  sanitizeSearchKeyword,
  sanitizeSearchKeywordForRegex,
} from '@/shared/utils/sanitize-search-keyword.util';
import { buildMongoObjectIdOrStringFieldMatch } from '@/shared/utils/mongo-object-id-field-match.util';

@Injectable()
export class InternalUserRepository implements InternalUserRepositoryPort {
  constructor(
    @InjectModel(InternalUser.name)
    private readonly model: Model<InternalUserDocument>,
  ) {}

  async findById(id: string): Promise<InternalUserEntity | null> {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return null;
    }
    const doc = await this.model
      .findOne({ _id: id, ...this.notDeletedFilter() })
      .lean()
      .exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findActiveByEmail(email: string): Promise<InternalUserEntity | null> {
    return this.findByEmail(email, { includeDeleted: false });
  }

  async findByEmail(
    email: string,
    options?: InternalUserLookupOptions,
  ): Promise<InternalUserEntity | null> {
    const query: Record<string, unknown> = { email: email.toLowerCase() };
    if (!options?.includeDeleted) {
      Object.assign(query, this.notDeletedFilter());
    }

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findByEmployeeCode(
    employeeCode: string,
    options?: InternalUserLookupOptions,
  ): Promise<InternalUserEntity | null> {
    const query: Record<string, unknown> = {
      employeeCode: employeeCode.trim().toUpperCase(),
    };
    if (!options?.includeDeleted) {
      Object.assign(query, this.notDeletedFilter());
    }

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findPaginated(
    filter: InternalUserFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<InternalUserEntity>> {
    const query = this.buildFilter(filter);
    const sort = this.buildSort(filter.sort, filter.order);
    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .select({
          name: 1,
          email: 1,
          employeeCode: 1,
          departmentId: 1,
          positionId: 1,
          isActive: 1,
          isDeleted: 1,
          role: 1,
          deviceSummary: 1,
        })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return {
      items: _.map(docs, (doc) => this.toEntity(doc)),
      total,
      page,
      limit,
    };
  }

  async save(user: InternalUserEntity): Promise<InternalUserEntity> {
    const obj = user.toPlainObject();
    const docObj = {
      name: obj.name as string,
      email: obj.email as string,
      employeeCode: obj.employeeCode as string,
      departmentId: obj.departmentId,
      positionId: obj.positionId,
      isActive: obj.isActive as boolean,
      isDeleted: (obj.isDeleted as boolean) ?? false,
      role: obj.role as string,
      deviceSummary: obj.deviceSummary as Record<string, unknown>,
    };
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(user.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate({ _id: user.id }, docObj, { upsert: true, new: true })
        .lean()
        .exec();
      return this.toEntity(doc);
    }
    const doc = await this.model.create(docObj);
    return this.toEntity(doc);
  }

  async findForExport(): Promise<InternalUserEntity[]> {
    const docs = await this.model
      .find(this.notDeletedFilter())
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async bulkUpdateDeviceSummaries(
    updates: {
      userId: string;
      total: number;
      activeAssignments: number;
    }[],
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    const ops = updates
      .filter((item) => /^[0-9a-fA-F]{24}$/.test(item.userId))
      .map((item) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(item.userId) },
          update: {
            $set: {
              'deviceSummary.total': item.total,
              'deviceSummary.activeAssignments': item.activeAssignments,
            },
          },
        },
      }));

    if (ops.length > 0) {
      await this.model.bulkWrite(ops);
    }
  }

  async countByDepartmentId(departmentId: string): Promise<number> {
    if (!/^[0-9a-fA-F]{24}$/.test(departmentId)) {
      return 0;
    }
    return this.model
      .countDocuments({
        $and: [
          this.notDeletedFilter(),
          buildMongoObjectIdOrStringFieldMatch('departmentId', departmentId),
        ],
      })
      .exec();
  }

  async findAllForDepartmentOverview(): Promise<InternalUserOverviewRow[]> {
    const docs = await this.model
      .find(this.notDeletedFilter())
      .select({
        name: 1,
        email: 1,
        employeeCode: 1,
        departmentId: 1,
        positionId: 1,
        isActive: 1,
        role: 1,
      })
      .lean()
      .exec();

    return docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      employeeCode: doc.employeeCode,
      departmentId: doc.departmentId ? String(doc.departmentId) : '',
      positionId: doc.positionId ? String(doc.positionId) : '',
      isActive: doc.isActive ?? true,
      role: doc.role ?? '',
    }));
  }

  private notDeletedFilter(): Record<string, unknown> {
    return {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };
  }

  private buildFilter(filter: InternalUserFilterInput): Record<string, unknown> {
    const query: Record<string, unknown>[] = [this.notDeletedFilter()];

    const pattern = sanitizeSearchKeywordForRegex(filter.search);
    if (pattern) {
      const search = sanitizeSearchKeyword(filter.search)!;
      const orConditions: Record<string, unknown>[] = [
        { name: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } },
        { employeeCode: { $regex: pattern, $options: 'i' } },
      ];

      const normalizedCode = search.replace(/\s+/g, '').toUpperCase();
      if (normalizedCode) {
        orConditions.push({ employeeCode: normalizedCode });
      }

      query.push({ $or: orConditions });
    }

    if (!_.isEmpty(filter.departmentId)) {
      query.push(
        buildMongoObjectIdOrStringFieldMatch(
          'departmentId',
          filter.departmentId as string,
        ),
      );
    }

    if (!_.isEmpty(filter.positionId)) {
      query.push(
        buildMongoObjectIdOrStringFieldMatch(
          'positionId',
          filter.positionId as string,
        ),
      );
    }

    if (!_.isNil(filter.isActive)) {
      query.push({ isActive: filter.isActive });
    }

    return { $and: query };
  }

  private buildSort(
    sortField?: string,
    order?: 'asc' | 'desc',
  ): Record<string, 1 | -1> {
    const allowed: Record<string, string> = {
      name: 'name',
      email: 'email',
      employeeCode: 'employeeCode',
      isActive: 'isActive',
      createdAt: 'createdAt',
      'deviceSummary.total': 'deviceSummary.total',
      'deviceSummary.activeAssignments': 'deviceSummary.activeAssignments',
    };
    const field = allowed[sortField ?? ''] ?? 'createdAt';
    const direction: 1 | -1 = order === 'asc' ? 1 : -1;
    return { [field]: direction };
  }

  private toEntity(doc: LeanInternalUser): InternalUserEntity {
    return new InternalUserEntity(String(doc._id), {
      name: doc.name,
      email: doc.email,
      employeeCode: doc.employeeCode,
      departmentId: String(doc.departmentId),
      positionId: String(doc.positionId),
      isActive: doc.isActive,
      isDeleted: doc.isDeleted ?? false,
      role: doc.role,
      deviceSummary: {
        total: doc.deviceSummary?.total ?? 0,
        activeAssignments: doc.deviceSummary?.activeAssignments ?? 0,
      },
    });
  }
}

type LeanInternalUser = {
  _id: unknown;
  name: string;
  email: string;
  employeeCode: string;
  departmentId: unknown;
  positionId: unknown;
  isActive: boolean;
  isDeleted?: boolean;
  role: string;
  deviceSummary?: {
    total: number;
    activeAssignments: number;
  };
};
