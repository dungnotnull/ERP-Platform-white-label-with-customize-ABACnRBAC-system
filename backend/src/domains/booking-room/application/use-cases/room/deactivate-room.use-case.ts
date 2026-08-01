import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { RoomRepositoryPort } from '../../ports/repositories/room.repository.port';
import { RoomNotFoundException } from '../../../domain/exceptions/room-not-found.exception';

@Injectable()
export class DeactivateRoomUseCase implements IUseCase<string, void> {
  constructor(
    @Inject('RoomRepositoryPort')
    private readonly roomRepository: RoomRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new RoomNotFoundException(id);
    }

    room.deactivate();
    await this.roomRepository.save(room);
  }
}
