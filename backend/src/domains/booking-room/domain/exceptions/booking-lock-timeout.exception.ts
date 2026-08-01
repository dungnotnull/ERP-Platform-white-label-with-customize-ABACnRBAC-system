import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class BookingLockTimeoutException extends DomainException {
  constructor() {
    super(
      'Booking queue is currently at capacity. Please wait a moment and try again.',
      409,
      'BOOKING_QUEUE_FULL',
      { message: 'Many booking requests are being processed. Please retry shortly.' }
    );
  }
}
