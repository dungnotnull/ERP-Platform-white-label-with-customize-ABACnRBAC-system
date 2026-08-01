import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MeetingRoomEntity } from '@/domains/booking-room/domain/entities/meeting-room.entity';
import { RoomRepositoryPort, RoomFilterInput } from '@/domains/booking-room/application/ports/repositories/room.repository.port';
import { MeetingRoom, MeetingRoomDocument } from '../schemas/meeting-room.schema';

@Injectable()
export class RoomRepository implements RoomRepositoryPort {
  constructor(@InjectModel(MeetingRoom.name) private readonly model: Model<MeetingRoomDocument>) {}

  async findById(id: string): Promise<MeetingRoomEntity | null> {
    const doc = await this.model.findById(id).lean().exec();
    return this.toEntity(doc);
  }

  async findAll(filter: RoomFilterInput): Promise<MeetingRoomEntity[]> {
    const query: Record<string, unknown> = {};

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { jpName: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const docs = await this.model.find(query).sort({ name: 1 }).lean().exec();
    return docs.map((doc) => this.toEntity(doc)).filter((e): e is MeetingRoomEntity => e !== null);
  }

  async save(room: MeetingRoomEntity): Promise<MeetingRoomEntity> {
    const plain = room.toPlainObject();
    const data = { ...plain };
    delete data.id;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(room.id);

    if (isObjectId) {
      const doc = await this.model.findByIdAndUpdate(room.id, data, { upsert: true, new: true }).exec();
      return this.toEntity(doc)!;
    }

    const doc = await this.model.create(data);
    return this.toEntity(doc)!;
  }

  private toEntity(doc: MeetingRoomDocument | Partial<MeetingRoom> | null | undefined): MeetingRoomEntity | null {
    if (!doc) return null;

    const plain = typeof (doc as MeetingRoomDocument).toJSON === 'function' ? (doc as MeetingRoomDocument).toJSON() : (doc as Partial<MeetingRoom>);
    const id = plain.id || (doc as { _id?: Types.ObjectId })._id?.toString() || '';

    return MeetingRoomEntity.create(id, {
      name: plain.name as string,
      jpName: (plain.jpName as string) || '',
      capacity: plain.capacity as number,
      description: plain.description || '',
      isActive: plain.isActive !== undefined ? plain.isActive : true,
    });
  }
}
