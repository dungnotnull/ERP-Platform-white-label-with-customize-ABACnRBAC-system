import { MeetingRoomEntity } from '@/domains/booking-room/domain/entities/meeting-room.entity';

export interface RoomFilterInput {
  isActive?: boolean;
  search?: string;
}

export interface RoomRepositoryPort {
  findById(id: string): Promise<MeetingRoomEntity | null>;
  findAll(filter: RoomFilterInput): Promise<MeetingRoomEntity[]>;
  save(room: MeetingRoomEntity): Promise<MeetingRoomEntity>;
}
