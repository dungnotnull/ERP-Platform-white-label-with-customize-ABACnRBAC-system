import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort, BookingTimelineFilter } from '../../ports/repositories/booking.repository.port';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

export interface GetTimelineInput {
  startDate: string;
  endDate: string;
  roomIds?: string[];
  departmentIds?: string[];
  participantIds?: string[];
  conflictedUsers?: string[];
  creatorId?: string;
  status?: BookingStatus;
  search?: string;
}

@Injectable()
export class GetTimelineUseCase implements IUseCase<GetTimelineInput, Record<string, unknown>[]> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
  ) {}

  async execute(input: GetTimelineInput): Promise<Record<string, unknown>[]> {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    const filter: BookingTimelineFilter = {};

    if (input.roomIds && input.roomIds.length > 0) {
      filter.roomIds = input.roomIds;
    }
    if (input.departmentIds && input.departmentIds.length > 0) {
      filter.departmentIds = input.departmentIds;
    }
    if (input.participantIds && input.participantIds.length > 0) {
      filter.participantIds = input.participantIds;
    }
    if (input.conflictedUsers && input.conflictedUsers.length > 0) {
      filter.conflictedUsers = input.conflictedUsers;
    }
    if (input.creatorId) {
      filter.creatorId = input.creatorId;
    }
    if (input.status) {
      filter.status = input.status;
    }
    if (input.search) {
      filter.search = input.search;
    }

    const bookings = await this.bookingRepository.findActiveBookingsInDateRange(start, end, filter);

    return bookings.map((b) => b.toPlainObject());
  }

}
