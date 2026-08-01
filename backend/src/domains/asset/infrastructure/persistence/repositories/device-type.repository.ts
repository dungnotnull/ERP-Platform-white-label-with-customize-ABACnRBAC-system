import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import { DeviceTypeEntity, DeviceTypeProps } from '@/domains/asset/domain/entities/device-type.entity';
import { DeviceTypeRepositoryPort } from '@/domains/asset/application/ports/repositories/device-type.repository.port';

@Injectable()
export class DeviceTypeRepository implements DeviceTypeRepositoryPort {
  constructor(
    @InjectModel('DeviceType') private readonly model: Model<any>,
  ) {}

  private toEntity(doc: any): DeviceTypeEntity {
    if (!doc) return null as any;

    const plain = doc.toJSON ? doc.toJSON() : doc;
    const id = plain.id || doc._id?.toString();

    const props: DeviceTypeProps = {
      name: plain.name,
      description: plain.description ?? '',
      isActive: plain.isActive ?? true,
    };

    return DeviceTypeEntity.create(id, props);
  }

  async findById(id: string): Promise<DeviceTypeEntity | null> {
    const doc = await this.model.findById(id).lean().exec();
    return this.toEntity(doc);
  }

  async findByName(name: string): Promise<DeviceTypeEntity | null> {
    const doc = await this.model.findOne({ name }).lean().exec();
    return this.toEntity(doc);
  }

  async findAll(): Promise<DeviceTypeEntity[]> {
    const docs = await this.model.find().sort({ name: 1 }).lean().exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async save(deviceType: DeviceTypeEntity): Promise<DeviceTypeEntity> {
    const plain = deviceType.toPlainObject();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(deviceType.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate(
          { _id: deviceType.id },
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
