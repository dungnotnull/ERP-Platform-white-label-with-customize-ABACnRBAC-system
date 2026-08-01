import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DeviceRequestInvalidTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(`Cannot transition device request from "${from}" to "${to}"`, 400);
  }
}
