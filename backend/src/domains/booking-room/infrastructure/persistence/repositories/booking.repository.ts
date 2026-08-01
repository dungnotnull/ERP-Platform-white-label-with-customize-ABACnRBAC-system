import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import _ from 'lodash';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import {
  BookingRepositoryPort,
  BookingFilterInput,
  BookingTimelineFilter,
  PaginatedResult,
  RoomUsageRow,
  DepartmentBookingRow,
  ConflictingUsersRow,
} from '@/domains/booking-room/application/ports/repositories/booking.repository.port';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import { BookingProps } from '@/domains/booking-room/domain/entities/booking.entity';
import { BookingConcurrentModificationException } from '@/domains/booking-room/domain/exceptions/booking-concurrent-modification.exception';

@Injectable()
export class BookingRepository implements BookingRepositoryPort {
  constructor(@InjectModel(Booking.name) private readonly model: Model<BookingDocument>) {}

  async findById(id: string, session?: ClientSession): Promise<BookingEntity | null> {
    const doc = await this.model.findById(id).session(session || null).lean().exec();
    return this.toEntity(doc);
  }

  async findAll(filter: BookingFilterInput): Promise<BookingEntity[]> {
    const query = this.buildQuery(filter);
    const docs = await this.model.find(query).sort({ startTime: 1 }).lean().exec();
    return docs.map((doc) => this.toEntity(doc)).filter((entity): entity is BookingEntity => entity !== null);
  }

  async findPaginated(filter: BookingFilterInput, page: number, limit: number): Promise<PaginatedResult<BookingEntity>> {
    const query = this.buildQuery(filter);
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ startTime: 1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items: docs.map((doc) => this.toEntity(doc)).filter((entity): entity is BookingEntity => entity !== null),
      total,
      page,
      limit,
    };
  }

  async findActiveBookingsInDateRange(
    startDate: Date,
    endDate: Date,
    filter?: BookingTimelineFilter,
    session?: ClientSession,
  ): Promise<BookingEntity[]> {
    const match: Record<string, unknown> = {
      $or: [{ startTime: { $lt: endDate }, endTime: { $gt: startDate } }],
    };

    if (filter?.status) {
      // When a specific status is requested (e.g. CANCELLED), return bookings
      // matching that status exactly without forcing the soft-delete exclusion,
      // so cancelled bookings remain retrievable.
      match.status = filter.status;
    } else {
      // Default timeline view: hide soft-deleted and cancelled bookings.
      match.isDeleted = { $ne: true };
      match.status = { $ne: BookingStatus.CANCELLED };
    }

    if (!_.isEmpty(filter?.roomIds) && filter?.roomIds) {
      const objectIds = filter.roomIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      match.roomIds = { $in: objectIds.length > 0 ? objectIds : filter.roomIds };
    }

    if (!_.isEmpty(filter?.departmentIds) && filter?.departmentIds) {
      const objectIds = filter.departmentIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      match.departmentIds = { $in: objectIds.length > 0 ? objectIds : filter.departmentIds };
    }

    if (!_.isEmpty(filter?.participantIds) && filter?.participantIds) {
      const objectIds = filter.participantIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      match.participantIds = { $in: objectIds.length > 0 ? objectIds : filter.participantIds };
    }

    if (!_.isEmpty(filter?.conflictedUsers) && filter?.conflictedUsers) {
      const objectIds = filter.conflictedUsers.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      match.conflictedUsers = { $in: objectIds.length > 0 ? objectIds : filter.conflictedUsers };
    }

    if (filter?.creatorId) {
      match.creatorId = Types.ObjectId.isValid(filter.creatorId) ? new Types.ObjectId(filter.creatorId) : filter.creatorId;
    }

    if (filter?.search) {
      const titleRegex = { $regex: filter.search, $options: 'i' };
      match.$and = [{ $or: [{ title: titleRegex }, { jpTitle: titleRegex }, { note: titleRegex }] }];
    }

    const docs = await this.model
      .find(match)
      .session(session || null)
      .populate('departmentIds')
      .sort({ startTime: 1 })
      .lean()
      .exec();
    return docs
      .map((doc) => this.toEntity(doc, (plain) => {
        const deptIds = _.get(plain, 'departmentIds', []);
        if (deptIds.length === 0) return [];
        const first = deptIds[0];
        if (first && typeof first === 'object' && '_id' in first) {
          return _.map(deptIds, (d: any) => ({
            id: d._id?.toString(),
            nameVi: d.nameVi,
            nameJa: d.nameJa,
          }));
        }
        return [];
      }))
      .filter((entity): entity is BookingEntity => entity !== null);
  }

  async findBookingsByTimeRange(startDate: Date, endDate: Date): Promise<BookingEntity[]> {
    const docs = await this.model
      .find({
        isDeleted: { $ne: true },
        $or: [
          { startTime: { $gte: startDate, $lte: endDate } },
          { endTime: { $gte: startDate, $lte: endDate } },
          { startTime: { $lt: startDate }, endTime: { $gt: endDate } },
        ],
      })
      .sort({ startTime: 1 })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc)).filter((entity): entity is BookingEntity => entity !== null);
  }

  async save(booking: BookingEntity, session?: ClientSession, expectedVersion?: number): Promise<BookingEntity> {
    const plain = booking.toPlainObject();
    const data: Record<string, unknown> = { ...plain };
    delete data.id;
    delete data.version;

    data.roomIds = (plain.roomIds as string[]).map((id: string) =>
      Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id,
    );

    data.departmentIds = ((plain.departmentIds as string[]) || []).map((id: string) =>
      Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id,
    );

    data.participantIds = ((plain.participantIds as string[]) || []).map((id: string) =>
      Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id,
    );

    data.conflictedUsers = ((plain.conflictedUsers as string[]) || []).map((id: string) =>
      Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id,
    );

    data.creatorId = plain.creatorId
      ? Types.ObjectId.isValid(plain.creatorId as string)
        ? new Types.ObjectId(plain.creatorId as string)
        : plain.creatorId
      : undefined;

    data.history = _.map(plain.history || [], (item: Record<string, unknown>) => ({
      ...item,
      actorId: item.actorId && Types.ObjectId.isValid(item.actorId as string) ? new Types.ObjectId(item.actorId as string) : item.actorId,
    }));

    const isObjectId = Types.ObjectId.isValid(booking.id);

    if (isObjectId && expectedVersion !== undefined) {
      const filter =
        expectedVersion === 0
          ? {
              _id: new Types.ObjectId(booking.id),
              $or: [{ version: 0 }, { version: { $exists: false } }],
            }
          : {
              _id: new Types.ObjectId(booking.id),
              version: expectedVersion,
            };
      const update = { $set: data, $inc: { version: 1 } };
      const doc = await this.model
        .findOneAndUpdate(filter, update, { upsert: false, new: true, session: session || undefined })
        .exec();
      if (!doc) {
        const current = await this.model.findById(booking.id).lean().exec();
        const actualVersion =
          current?.version === undefined || current?.version === null
            ? 0
            : (current.version as number);
        throw new BookingConcurrentModificationException(
          booking.id,
          expectedVersion,
          actualVersion,
        );
      }
      return this.toEntity(doc)!;
    }

    if (isObjectId) {
      const doc = await this.model
        .findByIdAndUpdate(booking.id, data, { upsert: true, new: true, session: session || undefined })
        .exec();
      return this.toEntity(doc)!;
    }

    const doc = await this.model.create([data], { session: session || undefined });
    return this.toEntity(doc[0])!;
  }

  async aggregateRoomUsage(startDate: Date, endDate: Date): Promise<RoomUsageRow[]> {
    const pipeline = [
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $ne: BookingStatus.CANCELLED },
          startTime: { $gte: startDate },
          endTime: { $lte: endDate },
        },
      },
      { $unwind: '$roomIds' },
      {
        $group: {
          _id: '$roomIds',
          totalBookings: { $sum: 1 },
          totalMinutes: {
            $sum: {
              $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000 * 60],
            },
          },
        },
      },
      {
        $project: {
          roomId: { $toString: '$_id' },
          totalBookings: 1,
          totalHours: { $divide: ['$totalMinutes', 60] },
          _id: 0,
        },
      },
    ];

    const rows = await this.model.aggregate(pipeline).exec();

    return rows.map((row) => ({
      roomId: row.roomId,
      roomName: '',
      totalBookings: row.totalBookings,
      totalHours: Math.round(row.totalHours * 100) / 100,
    }));
  }

  async aggregateDepartmentBookingCount(startDate: Date, endDate: Date): Promise<DepartmentBookingRow[]> {
    const pipeline = [
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $ne: BookingStatus.CANCELLED },
          startTime: { $gte: startDate },
          endTime: { $lte: endDate },
        },
      },
      { $unwind: '$departmentIds' },
      {
        $group: {
          _id: '$departmentIds',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          departmentId: { $toString: '$_id' },
          count: 1,
          _id: 0,
        },
      },
    ];

    const rows = await this.model.aggregate(pipeline).exec();

    return rows.map((row) => ({
      departmentId: row.departmentId,
      count: row.count,
    }));
  }

  async aggregateConflictingUsers(startDate: Date, endDate: Date): Promise<ConflictingUsersRow[]> {
    const pipeline = [
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $ne: BookingStatus.CANCELLED },
          startTime: { $gte: startDate },
          endTime: { $lte: endDate },
          conflictedUsers: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$conflictedUsers' },
      {
        $group: {
          _id: '$conflictedUsers',
          conflictCount: { $sum: 1 },
          bookingIds: { $push: '$_id' },
        },
      },
      {
        $project: {
          userId: { $toString: '$_id' },
          conflictCount: 1,
          bookingIds: { $map: { input: '$bookingIds', as: 'bid', in: { $toString: '$$bid' } } },
          _id: 0,
        },
      },
    ];

    const rows = await this.model.aggregate(pipeline).exec();

    return rows.map((row) => ({
      userId: row.userId,
      conflictCount: row.conflictCount,
      bookingIds: row.bookingIds,
    }));
  }

  async deleteOldBookings(beforeDate: Date): Promise<number> {
    const result = await this.model.deleteMany({ endTime: { $lt: beforeDate } }).exec();
    return result.deletedCount || 0;
  }

  private buildQuery(filter: BookingFilterInput): Record<string, unknown> {
    const query: Record<string, unknown>[] = [];

    if (!_.isNil(filter.isDeleted)) {
      query.push({ isDeleted: filter.isDeleted });
    } else {
      query.push({ isDeleted: { $ne: true } });
    }

    if (filter.status) {
      query.push({ status: filter.status });
    }

    if (!_.isEmpty(filter.roomIds) && filter.roomIds) {
      const objectIds = filter.roomIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      query.push({ roomIds: { $in: objectIds.length > 0 ? objectIds : filter.roomIds } });
    }

    if (!_.isEmpty(filter.participantIds) && filter.participantIds) {
      const objectIds = filter.participantIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      query.push({ participantIds: { $in: objectIds.length > 0 ? objectIds : filter.participantIds } });
    }

    if (!_.isEmpty(filter.departmentIds) && filter.departmentIds) {
      const objectIds = filter.departmentIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      query.push({ departmentIds: { $in: objectIds.length > 0 ? objectIds : filter.departmentIds } });
    }

    if (!_.isEmpty(filter.conflictedUsers) && filter.conflictedUsers) {
      const objectIds = filter.conflictedUsers.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      query.push({ conflictedUsers: { $in: objectIds.length > 0 ? objectIds : filter.conflictedUsers } });
    }

    if (filter.creatorId) {
      const creatorId = Types.ObjectId.isValid(filter.creatorId) ? new Types.ObjectId(filter.creatorId) : filter.creatorId;
      query.push({ creatorId });
    }

    if (filter.startDate || filter.endDate) {
      const dateQuery: Record<string, unknown> = {};
      if (filter.startDate) {
        dateQuery.$gte = filter.startDate;
      }
      if (filter.endDate) {
        dateQuery.$lte = filter.endDate;
      }
      query.push({ startTime: dateQuery });
    }

    if (filter.search) {
      const titleRegex = { $regex: filter.search, $options: 'i' };
      query.push({ $or: [{ title: titleRegex }, { jpTitle: titleRegex }, { note: titleRegex }] });
    }

    return query.length > 0 ? { $and: query } : {};
  }

  private toEntity(
    doc: BookingDocument | Partial<Booking> | null | undefined,
    departmentExtractor?: (plain: Partial<Booking>) => unknown[],
  ): BookingEntity | null {
    if (!doc) return null;

    const plain = typeof (doc as BookingDocument).toJSON === 'function' ? (doc as BookingDocument).toJSON() : (doc as Partial<Booking>);
    const id = plain.id || (doc as { _id?: Types.ObjectId })._id?.toString() || '';

    type PopulatedId = string | Types.ObjectId | { _id: Types.ObjectId };
    const extractId = (idObj: PopulatedId) => (typeof idObj === 'object' && idObj !== null && '_id' in idObj ? idObj._id?.toString() : idObj?.toString());

    const props: BookingProps = {
      roomIds: _.map(plain.roomIds || [], extractId) as string[],
      title: plain.title as string,
      departmentIds: _.map(plain.departmentIds || [], extractId) as string[],
      participantIds: _.map(plain.participantIds || [], extractId) as string[],
      conflictedUsers: _.map(plain.conflictedUsers || [], extractId) as string[],
      creatorId: extractId(plain.creatorId as PopulatedId) as string,
      startTime: plain.startTime as Date,
      endTime: plain.endTime as Date,
      note: plain.note || '',
      jpTitle: (plain.jpTitle as string) || '',
      jpNote: (plain.jpNote as string) || '',
      status: plain.status as BookingStatus,
      isDeleted: plain.isDeleted || false,
      deletedAt: plain.deletedAt || null,
      history: (((plain.history as unknown) as Record<string, unknown>[]) || []).map((h) => ({
        action: h.action as 'CREATED' | 'UPDATED' | 'CANCELLED' | 'COMPLETED',
        actorId: extractId(h.actorId as PopulatedId) as string,
        changes: h.changes as Record<string, unknown> | undefined,
        timestamp: h.timestamp as Date,
      })),
      version: (plain.version as number) ?? 0,
    };

    const entity = BookingEntity.create(id, props);

    if (departmentExtractor) {
      const departments = departmentExtractor(plain);
      if (departments && departments.length > 0) {
        entity.setPopulatedDepartments(departments);
      }
    }

    return entity;
  }
}
