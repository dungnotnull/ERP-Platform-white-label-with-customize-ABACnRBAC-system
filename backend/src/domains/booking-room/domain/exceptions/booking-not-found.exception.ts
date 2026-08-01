import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class BookingNotFoundException extends DomainException {
  constructor(bookingId: string) {
    super(
      `Booking with ID ${bookingId} not found`,
      404,
      'BOOKING_NOT_FOUND',
      { bookingId }
    );
  }
}
