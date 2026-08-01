import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateBookingDto } from '../../dtos/booking.dto';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { BookingMutationLockService } from '../../services/booking-mutation-lock.service';
import { BookingEntity } from '../../../domain/entities/booking.entity';
import { InvalidTimeRangeException } from '../../../domain/exceptions/invalid-time-range.exception';
import { RoomConflictException } from '../../../domain/exceptions/room-conflict.exception';
import { BookingLockTimeoutException } from '../../../domain/exceptions/booking-lock-timeout.exception';
import { BookingStatus } from '../../../domain/enums/booking-status.enum';

export interface CreateBookingInput {
  data: CreateBookingDto;
  creatorId: string;
}

@Injectable()
export class CreateBookingUseCase implements IUseCase<CreateBookingInput, Record<string, unknown>> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    private readonly lockService: BookingMutationLockService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(input: CreateBookingInput): Promise<Record<string, unknown>> {
    const { data, creatorId } = input;
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      throw new InvalidTimeRangeException();
    }

    const normalizedTitle = data.title.trim();
    const id = new Types.ObjectId().toString();

    try {
      return await this.lockService.runExclusive(
        () =>
          this.connection.transaction(async (session) => {
            const activeBookings = await this.bookingRepository.findActiveBookingsInDateRange(
              startTime,
              endTime,
              { roomIds: data.roomIds },
              session,
            );
            if (activeBookings.length > 0) {
              throw new RoomConflictException(data.roomIds);
            }

            const allActiveBookingsInTime = await this.bookingRepository.findActiveBookingsInDateRange(
              startTime,
              endTime,
              undefined,
              session,
            );

            const conflictedUsers = new Set<string>();
            for (const participantId of data.participantIds || []) {
              const hasConflict = allActiveBookingsInTime.some((booking) =>
                booking.participantIds.includes(participantId),
              );
              if (hasConflict) {
                conflictedUsers.add(participantId);
              }
            }

            const booking = BookingEntity.create(id, {
              roomIds: data.roomIds,
              title: normalizedTitle,
              departmentIds: data.departmentIds || [],
              participantIds: data.participantIds || [],
              conflictedUsers: Array.from(conflictedUsers),
              creatorId,
              startTime,
              endTime,
              note: data.note || '',
              jpTitle: data.jpTitle || '',
              jpNote: data.jpNote || '',
              status: BookingStatus.SCHEDULED,
              isDeleted: false,
              deletedAt: null,
              history: [
                {
                  action: 'CREATED',
                  actorId: creatorId,
                  timestamp: new Date(),
                },
              ],
              version: 0,
            });

            const savedBooking = await this.bookingRepository.save(booking, session);
            return savedBooking.toPlainObject();
          }),
        'create-booking',
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOKING_QUEUE_FULL') {
        throw new BookingLockTimeoutException();
      }
      throw error;
    }
  }
}
