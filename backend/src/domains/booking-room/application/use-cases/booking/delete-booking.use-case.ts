import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { BookingMutationLockService } from '../../services/booking-mutation-lock.service';
import { BookingNotFoundException } from '../../../domain/exceptions/booking-not-found.exception';
import { BookingAlreadyDeletedException } from '../../../domain/exceptions/booking-already-deleted.exception';
import { BookingConcurrentModificationException } from '../../../domain/exceptions/booking-concurrent-modification.exception';
import { BookingLockTimeoutException } from '../../../domain/exceptions/booking-lock-timeout.exception';
import { BookingStatus } from '../../../domain/enums/booking-status.enum';

export interface DeleteBookingInput {
  id: string;
  expectedVersion: number;
  actorId: string;
}

@Injectable()
export class DeleteBookingUseCase implements IUseCase<DeleteBookingInput, void> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    private readonly lockService: BookingMutationLockService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(input: DeleteBookingInput): Promise<void> {
    try {
      await this.lockService.runExclusive(
        () =>
          this.connection.transaction(async (session) => {
            const booking = await this.bookingRepository.findById(input.id, session);
            if (!booking) {
              throw new BookingNotFoundException(input.id);
            }

            if (booking.version !== input.expectedVersion) {
              throw new BookingConcurrentModificationException(
                input.id,
                input.expectedVersion,
                booking.version,
              );
            }

            if (booking.isDeleted || booking.status === BookingStatus.CANCELLED) {
              throw new BookingAlreadyDeletedException(input.id);
            }

            booking.cancel(input.actorId);
            await this.bookingRepository.save(booking, session, input.expectedVersion);
          }),
        'delete-booking',
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOKING_QUEUE_FULL') {
        throw new BookingLockTimeoutException();
      }
      throw error;
    }
  }
}
