import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class RoomConflictException extends DomainException {
  constructor(roomIds: string[]) {
    super(
      `Room conflict detected for rooms: ${roomIds.join(', ')}`,
      400,
      'ROOM_CONFLICT',
      { roomIds: roomIds.join(', ') }
    );
  }
}
