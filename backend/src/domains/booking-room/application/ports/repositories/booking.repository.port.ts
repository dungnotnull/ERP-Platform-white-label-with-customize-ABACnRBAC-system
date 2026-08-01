import { ClientSession } from 'mongoose';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

export interface BookingFilterInput {
  roomIds?: string[];
  departmentIds?: string[];
  participantIds?: string[];
  conflictedUsers?: string[];
  creatorId?: string;
  status?: BookingStatus;
  isDeleted?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RoomUsageRow {
  roomId: string;
  roomName: string;
  totalBookings: number;
  totalHours: number;
}

export interface DepartmentBookingRow {
  departmentId: string;
  count: number;
}

export interface BookingTimelineFilter {
  roomIds?: string[];
  departmentIds?: string[];
  participantIds?: string[];
  conflictedUsers?: string[];
  creatorId?: string;
  status?: BookingStatus;
  search?: string;
}

export interface ConflictingUsersRow {
  userId: string;
  conflictCount: number;
  bookingIds: string[];
}

export interface BookingRepositoryPort {
  findById(id: string, session?: ClientSession): Promise<BookingEntity | null>;
  findAll(filter: BookingFilterInput): Promise<BookingEntity[]>;
  findPaginated(filter: BookingFilterInput, page: number, limit: number): Promise<PaginatedResult<BookingEntity>>;
  save(booking: BookingEntity, session?: ClientSession, expectedVersion?: number): Promise<BookingEntity>;
  findActiveBookingsInDateRange(startDate: Date, endDate: Date, filter?: BookingTimelineFilter, session?: ClientSession): Promise<BookingEntity[]>;
  findBookingsByTimeRange(startDate: Date, endDate: Date): Promise<BookingEntity[]>;
  aggregateRoomUsage(startDate: Date, endDate: Date): Promise<RoomUsageRow[]>;
  aggregateDepartmentBookingCount(startDate: Date, endDate: Date): Promise<DepartmentBookingRow[]>;
  aggregateConflictingUsers(startDate: Date, endDate: Date): Promise<ConflictingUsersRow[]>;
  deleteOldBookings(beforeDate: Date): Promise<number>;
}
