import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InternalUserQueryPort as BookingRoomInternalUserQueryPort, InternalUserDetails } from '@/domains/booking-room/application/ports/services/internal-user-query.port';
import { InternalUserQueryPort as IdentityInternalUserQueryPort } from '@/domains/identity/application/ports/internal-user-query.port';
import { InternalUser, InternalUserDocument } from '../persistence/schemas/internal-user.schema';
import { Department, DepartmentDocument } from '../persistence/schemas/department.schema';
import {
  sanitizeSearchKeyword,
  sanitizeSearchKeywordForRegex,
} from '@/shared/utils/sanitize-search-keyword.util';
import { buildMongoObjectIdOrStringFieldMatch } from '@/shared/utils/mongo-object-id-field-match.util';

@Injectable()
export class InternalUserQueryAdapter implements BookingRoomInternalUserQueryPort, IdentityInternalUserQueryPort {
  constructor(
    @InjectModel(InternalUser.name) private readonly model: Model<InternalUserDocument>,
    @InjectModel(Department.name) private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  private notDeletedFilter(): Record<string, unknown> {
    return {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };
  }

  private activeOnlyFilter(): Record<string, unknown> {
    return { isActive: true };
  }

  async findActivePaginated(input: {
    search?: string;
    departmentId?: string;
    page: number;
    limit: number;
  }): Promise<{
    items: InternalUserDetails[];
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  }> {
    const query: Record<string, unknown>[] = [
      this.notDeletedFilter(),
      this.activeOnlyFilter(),
    ];

    const pattern = sanitizeSearchKeywordForRegex(input.search);
    if (pattern) {
      const search = sanitizeSearchKeyword(input.search)!;
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

    if (input.departmentId) {
      query.push(
        buildMongoObjectIdOrStringFieldMatch('departmentId', input.departmentId),
      );
    }

    const mongoQuery = { $and: query };
    const skip = (input.page - 1) * input.limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(mongoQuery)
        .select('_id name email departmentId isActive')
        .sort({ name: 1 })
        .skip(skip)
        .limit(input.limit)
        .lean()
        .exec(),
      this.model.countDocuments(mongoQuery).exec(),
    ]);

    const pageCount =
      input.limit > 0 ? Math.max(1, Math.ceil(total / input.limit)) : 1;

    return {
      items: docs.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        departmentId: doc.departmentId?.toString() || '',
      })),
      total,
      page: input.page,
      limit: input.limit,
      pageCount,
    };
  }

  async findById(id: string): Promise<InternalUserDetails | null> {
    const doc = await this.model.findById(id).select('_id name email departmentId').lean().exec();
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      departmentId: doc.departmentId?.toString() || '',
    };
  }

  async findByEmail(email: string): Promise<InternalUserDetails | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    const doc = await this.model
      .findOne({
        email: normalizedEmail,
        isDeleted: { $ne: true },
      })
      .select('_id name email departmentId')
      .lean()
      .exec();

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      departmentId: doc.departmentId?.toString() || '',
    };
  }

  async findByIds(ids: string[]): Promise<InternalUserDetails[]> {
    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const docs = await this.model.find({ _id: { $in: objectIds } }).select('_id name email departmentId').lean().exec();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      departmentId: doc.departmentId?.toString() || '',
    }));
  }

  async findByDepartmentId(departmentId: string, search?: string): Promise<InternalUserDetails[]> {
    const objectId = Types.ObjectId.isValid(departmentId) ? new Types.ObjectId(departmentId) : departmentId;
    const query: Record<string, unknown> = {
      departmentId: objectId,
      ...this.notDeletedFilter(),
      ...this.activeOnlyFilter(),
    };

    if (search && search.trim().length > 0) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const docs = await this.model
      .find(query)
      .select('_id name email departmentId')
      .sort({ name: 1 })
      .lean()
      .exec();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      departmentId: doc.departmentId?.toString() || '',
    }));
  }

  async findDepartmentCodeByEmail(email: string): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    const doc = await this.model
      .findOne({
        email: normalizedEmail,
        isDeleted: { $ne: true },
      })
      .select('departmentId')
      .lean()
      .exec();

    if (!doc || !doc.departmentId) return null;

    const department = await this.departmentModel
      .findById(doc.departmentId)
      .select('code isDeleted')
      .lean()
      .exec();

    if (!department || department.isDeleted) return null;

    return department.code || null;
  }
}
