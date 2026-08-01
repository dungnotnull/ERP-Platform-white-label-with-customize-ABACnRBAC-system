import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateBookingDto } from '../../dtos/booking.dto';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { BookingMutationLockService } from '../../services/booking-mutation-lock.service';
import { BookingNotFoundException } from '../../../domain/exceptions/booking-not-found.exception';
import { BookingConcurrentModificationException } from '../../../domain/exceptions/booking-concurrent-modification.exception';
import { InvalidTimeRangeException } from '../../../domain/exceptions/invalid-time-range.exception';
import { RoomConflictException } from '../../../domain/exceptions/room-conflict.exception';
import { BookingLockTimeoutException } from '../../../domain/exceptions/booking-lock-timeout.exception';

export interface UpdateBookingInput {
  id: string;
  data: UpdateBookingDto;
  actorId: string;
}

@Injectable()
export class UpdateBookingUseCase implements IUseCase<UpdateBookingInput, Record<string, unknown>> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    private readonly lockService: BookingMutationLockService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(input: UpdateBookingInput): Promise<Record<string, unknown>> {
    try {
      return await this.lockService.runExclusive(
        () =>
          this.connection.transaction(async (session) => {
            const booking = await this.bookingRepository.findById(input.id, session);
            if (!booking) {
              throw new BookingNotFoundException(input.id);
            }

            if (booking.version !== input.data.expectedVersion) {
              throw new BookingConcurrentModificationException(
                input.id,
                input.data.expectedVersion,
                booking.version,
              );
            }

            const newStartTime = input.data.startTime ? new Date(input.data.startTime) : booking.startTime;
            const newEndTime = input.data.endTime ? new Date(input.data.endTime) : booking.endTime;
            const newRoomIds = input.data.roomIds || booking.roomIds;
            const newParticipantIds = input.data.participantIds || booking.participantIds;

            if (newEndTime <= newStartTime) {
              throw new InvalidTimeRangeException();
            }

            const activeBookings = await this.bookingRepository.findActiveBookingsInDateRange(
              newStartTime,
              newEndTime,
              { roomIds: newRoomIds },
              session,
            );
            const conflictingOtherBookings = activeBookings.filter((b) => b.id !== booking.id);
            if (conflictingOtherBookings.length > 0) {
              throw new RoomConflictException(newRoomIds);
            }

            const allActiveBookingsInTime = await this.bookingRepository.findActiveBookingsInDateRange(
              newStartTime,
              newEndTime,
              undefined,
              session,
            );

            const conflictedUsers = new Set<string>();
            for (const participantId of newParticipantIds) {
              const hasConflict = allActiveBookingsInTime.some(
                (b) => b.id !== booking.id && b.participantIds.includes(participantId),
              );
              if (hasConflict) {
                conflictedUsers.add(participantId);
              }
            }

            booking.modifyDetails(
              {
                roomIds: input.data.roomIds,
                title: input.data.title?.trim(),
                departmentIds: input.data.departmentIds,
                participantIds: input.data.participantIds,
                startTime: input.data.startTime ? new Date(input.data.startTime) : undefined,
                endTime: input.data.endTime ? new Date(input.data.endTime) : undefined,
                note: input.data.note,
                jpTitle: input.data.jpTitle,
                jpNote: input.data.jpNote,
              },
              input.actorId,
            );
            booking.updateRoomConflict(Array.from(conflictedUsers));

            const updatedBooking = await this.bookingRepository.save(
              booking,
              session,
              input.data.expectedVersion,
            );
            return updatedBooking.toPlainObject();
          }),
        'update-booking',
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOKING_QUEUE_FULL') {
        throw new BookingLockTimeoutException();
      }
      throw error;
    }
  }
}
