import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class InvalidDeviceStatusTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(`Invalid status transition from "${from}" to "${to}"`, 400);
  }
}
