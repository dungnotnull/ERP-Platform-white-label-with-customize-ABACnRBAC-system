import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateRoomDto } from '../../dtos/room.dto';
import { RoomRepositoryPort } from '../../ports/repositories/room.repository.port';
import { MeetingRoomEntity } from '../../../domain/entities/meeting-room.entity';
import { Types } from 'mongoose';

@Injectable()
export class CreateRoomUseCase implements IUseCase<CreateRoomDto, Record<string, unknown>> {
  constructor(
    @Inject('RoomRepositoryPort')
    private readonly roomRepository: RoomRepositoryPort,
  ) {}

  async execute(input: CreateRoomDto): Promise<Record<string, unknown>> {
    const id = new Types.ObjectId().toString();
    const room = MeetingRoomEntity.create(id, {
      name: input.name,
      jpName: input.jpName || '',
      capacity: input.capacity,
      description: input.description || '',
      isActive: true,
    });

    const savedRoom = await this.roomRepository.save(room);
    return savedRoom.toPlainObject();
  }
}
