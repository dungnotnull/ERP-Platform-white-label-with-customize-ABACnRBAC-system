import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DuplicateBookingTitleException extends DomainException {
  constructor(title: string) {
    super(
      `Booking title already exists: ${title}`,
      400,
      'DUPLICATE_BOOKING_TITLE',
      { title },
    );
  }
}
