import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class InvalidTimeRangeException extends DomainException {
  constructor() {
    super(
      'End time must be after start time',
      400,
      'INVALID_TIME_RANGE',
      {}
    );
  }
}
