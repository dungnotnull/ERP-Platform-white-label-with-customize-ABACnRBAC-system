import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateRoomDto } from '../../dtos/room.dto';
import { RoomRepositoryPort } from '../../ports/repositories/room.repository.port';
import { RoomNotFoundException } from '../../../domain/exceptions/room-not-found.exception';

export interface UpdateRoomInput {
  id: string;
  data: UpdateRoomDto;
}

@Injectable()
export class UpdateRoomUseCase implements IUseCase<UpdateRoomInput, Record<string, unknown>> {
  constructor(
    @Inject('RoomRepositoryPort')
    private readonly roomRepository: RoomRepositoryPort,
  ) {}

  async execute(input: UpdateRoomInput): Promise<Record<string, unknown>> {
    const room = await this.roomRepository.findById(input.id);
    if (!room) {
      throw new RoomNotFoundException(input.id);
    }

    room.update(input.data);
    const updatedRoom = await this.roomRepository.save(room);
    return updatedRoom.toPlainObject();
  }
}
