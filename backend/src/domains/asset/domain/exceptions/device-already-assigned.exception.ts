import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DeviceAlreadyAssignedException extends DomainException {
  constructor(deviceId: string) {
    super(`Device "${deviceId}" is already assigned to a user`, 409, 'DEVICE_ALREADY_ASSIGNED', {
      deviceId,
    });
  }
}
