import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DeviceRequestNotFoundException extends DomainException {
  constructor(requestId: string) {
    super(`Device request with id "${requestId}" not found`, 404);
  }
}
