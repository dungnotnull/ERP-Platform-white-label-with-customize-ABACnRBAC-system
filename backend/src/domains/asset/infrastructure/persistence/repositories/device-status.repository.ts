import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import { DeviceStatusEntity, DeviceStatusProps } from '@/domains/asset/domain/entities/device-status.entity';
import { DeviceStatusRepositoryPort } from '@/domains/asset/application/ports/repositories/device-status.repository.port';

@Injectable()
export class DeviceStatusRepository implements DeviceStatusRepositoryPort {
  constructor(
    @InjectModel('DeviceStatus') private readonly model: Model<any>,
  ) {}

  private toEntity(doc: any): DeviceStatusEntity {
    if (!doc) return null as any;

    const plain = doc.toJSON ? doc.toJSON() : doc;
    const id = plain.id || doc._id?.toString();

    const props: DeviceStatusProps = {
      name: plain.name,
      description: plain.description ?? '',
      isActive: plain.isActive ?? true,
    };

    return DeviceStatusEntity.create(id, props);
  }

  async findById(id: string): Promise<DeviceStatusEntity | null> {
    const doc = await this.model.findById(id).lean().exec();
    return this.toEntity(doc);
  }

  async findByName(name: string): Promise<DeviceStatusEntity | null> {
    const doc = await this.model.findOne({ name }).lean().exec();
    return this.toEntity(doc);
  }

  async findAll(): Promise<DeviceStatusEntity[]> {
    const docs = await this.model.find().sort({ name: 1 }).lean().exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async save(deviceStatus: DeviceStatusEntity): Promise<DeviceStatusEntity> {
    const plain = deviceStatus.toPlainObject();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(deviceStatus.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate(
          { _id: deviceStatus.id },
          _.omit(plain, 'id'),
          { upsert: true, new: true },
        )
        .exec();
      return this.toEntity(doc);
    }
    const doc = await this.model.create(_.omit(plain, 'id'));
    return this.toEntity(doc);
  }
}
