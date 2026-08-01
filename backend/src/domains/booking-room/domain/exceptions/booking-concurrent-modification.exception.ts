import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class BookingConcurrentModificationException extends DomainException {
  constructor(bookingId: string, expectedVersion: number, actualVersion: number) {
    super(
      'Unable to update booking. It was recently modified by someone else. Please refresh the page to see the latest changes and try again.',
      409,
      'BOOKING_CONCURRENT_MODIFICATION',
      {
        bookingId,
        expectedVersion: String(expectedVersion),
        actualVersion: String(actualVersion),
      },
    );
  }
}
