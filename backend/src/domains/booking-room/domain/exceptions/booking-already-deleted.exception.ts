import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class BookingAlreadyDeletedException extends DomainException {
  constructor(bookingId: string) {
    super(
      `Booking with ID ${bookingId} has already been deleted`,
      409,
      'BOOKING_ALREADY_DELETED',
      { bookingId },
    );
  }
}
