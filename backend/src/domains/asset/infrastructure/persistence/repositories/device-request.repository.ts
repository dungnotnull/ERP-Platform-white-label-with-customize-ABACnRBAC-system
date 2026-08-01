import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import { DeviceRequestEntity, DeviceRequestProps } from '@/domains/asset/domain/entities/device-request.entity';
import { DeviceRequestItemVo } from '@/domains/asset/domain/value-objects/device-request-item.vo';
import { DeviceRequestDeviceVo } from '@/domains/asset/domain/value-objects/device-request-device.vo';
import {
  DeviceRequestRepositoryPort,
  DeviceRequestFilterInput,
} from '@/domains/asset/application/ports/repositories/device-request.repository.port';
import { PaginatedResult } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { sanitizeSearchKeyword } from '@/shared/utils/sanitize-search-keyword.util';

@Injectable()
export class DeviceRequestRepository implements DeviceRequestRepositoryPort {
  constructor(
    @InjectModel('DeviceRequest') private readonly model: Model<any>,
  ) {}

  private toEntity(doc: any): DeviceRequestEntity {
    if (!doc) return null as any;

    const plain = doc.toJSON ? doc.toJSON() : doc;
    const id = plain.id || doc._id?.toString();

    const props: DeviceRequestProps = {
      type: plain.type,
      status: plain.status,
      userId:
        typeof plain.userId === 'object'
          ? plain.userId?._id?.toString()
          : plain.userId,
      user:
        typeof plain.userId === 'object'
          ? {
              ...plain.userId,
              id: plain.userId?._id?.toString(),
            }
          : undefined,
      requestedByUserId:
        typeof plain.requestedByUserId === 'object'
          ? plain.requestedByUserId?._id?.toString()
          : plain.requestedByUserId,
      requestedByUser:
        typeof plain.requestedByUserId === 'object'
          ? {
              ...plain.requestedByUserId,
              id: plain.requestedByUserId?._id?.toString(),
            }
          : undefined,
      approvedByUserId: plain.approvedByUserId
        ? (typeof plain.approvedByUserId === 'object' ? plain.approvedByUserId?.toString() : plain.approvedByUserId)
        : undefined,
      approvedByUser:
        typeof plain.approvedByUserId === 'object'
          ? {
              ...plain.approvedByUserId,
              id: plain.approvedByUserId?._id?.toString(),
            }
          : undefined,
      reason: plain.reason ?? '',
      approvedAt: plain.approvedAt ?? undefined,
      completedAt: plain.completedAt ?? undefined,
      createdAt: plain.createdAt ?? undefined,
      updatedAt: plain.updatedAt ?? undefined,
      items: _.map(plain.items ?? [], (item) =>
        new DeviceRequestItemVo({
          deviceTypeId:
            typeof item.deviceTypeId === 'object' &&
            item.deviceTypeId?._id
              ? item.deviceTypeId._id.toString()
              : item.deviceTypeId,

          quantity: item.quantity,

          deviceType:
            typeof item.deviceTypeId === 'object' &&
            item.deviceTypeId?._id
              ? {
                  ...item.deviceTypeId,
                  id: item.deviceTypeId._id.toString(),
                }
              : undefined,
        }),
      ),
      replacementDevices: _.map(plain.replacementDevices ?? [], (d) =>
        new DeviceRequestDeviceVo({
          oldDeviceId: typeof d.oldDeviceId === 'object' ? d.oldDeviceId?.toString() : d.oldDeviceId,
          newDeviceId: typeof d.newDeviceId === 'object' ? d.newDeviceId?.toString() : d.newDeviceId,
        }),
      ),
    };

    return DeviceRequestEntity.create(id, props);
  }

  async findById(id: string): Promise<DeviceRequestEntity | null> {
    const doc = await this.model
      .findById(id)
      .populate('userId')
      .populate('requestedByUserId')
      .populate('approvedByUserId')
      .populate('items.deviceTypeId')
      .lean()
      .exec();

    return this.toEntity(doc);
  }

  async findPaginated(
    filter: DeviceRequestFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<DeviceRequestEntity>> {
    const query = this.buildFilterQuery(filter);
    const [docs, total] = await Promise.all([
      this.model
        .find(query)

        .populate('userId')
        .populate('requestedByUserId')
        .populate('approvedByUserId')
        .populate('items.deviceTypeId')

        .sort({ createdAt: -1 })
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

  async save(request: DeviceRequestEntity): Promise<DeviceRequestEntity> {
    const plain = request.toPlainObject();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(request.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate(
          { _id: request.id },
          _.omit(plain, 'id'),
          { upsert: true, new: true },
        )
        .exec();
      return this.toEntity(doc);
    }
    const doc = await this.model.create(_.omit(plain, 'id'));
    return this.toEntity(doc);
  }

  private buildFilterQuery(filter: DeviceRequestFilterInput): Record<string, unknown> {
    const query: Record<string, unknown>[] = [];

    const search = sanitizeSearchKeyword(filter.search);
    if (!_.isNil(search)) {
      query.push({
        $or: [
          { reason: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (!_.isNil(filter.status)) {
      query.push({ status: filter.status });
    }

    if (!_.isNil(filter.type)) {
      query.push({ type: filter.type });
    }

    if (!_.isNil(filter.userId)) {
      query.push({ userId: filter.userId });
    }

    if (!_.isNil(filter.requestedByUserId)) {
      query.push({ requestedByUserId: filter.requestedByUserId });
    }

    return query.length > 0 ? { $and: query } : {};
  }
}
