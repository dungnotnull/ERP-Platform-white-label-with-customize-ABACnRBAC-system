import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class RoomNotFoundException extends DomainException {
  constructor(roomId: string) {
    super(
      `Room with ID ${roomId} not found or inactive`,
      404,
      'ROOM_NOT_FOUND',
      { roomId }
    );
  }
}
