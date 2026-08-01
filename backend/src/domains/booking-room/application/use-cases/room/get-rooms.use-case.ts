import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { FindRoomsDto } from '../../dtos/room.dto';
import { RoomRepositoryPort } from '../../ports/repositories/room.repository.port';

@Injectable()
export class GetRoomsUseCase implements IUseCase<FindRoomsDto, Record<string, unknown>[]> {
  constructor(
    @Inject('RoomRepositoryPort')
    private readonly roomRepository: RoomRepositoryPort,
  ) {}

  async execute(input: FindRoomsDto): Promise<Record<string, unknown>[]> {
    const rooms = await this.roomRepository.findAll({
      isActive: true,
      search: input.search,
    });
    
    return rooms.map((room) => room.toPlainObject());
  }
}
