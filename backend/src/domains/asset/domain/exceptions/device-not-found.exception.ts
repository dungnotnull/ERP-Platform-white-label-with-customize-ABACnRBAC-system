import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DeviceNotFoundException extends DomainException {
  constructor(deviceId: string) {
    super(`Device with id "${deviceId}" not found`, 404, 'DEVICE_NOT_FOUND', {
      deviceId,
    });
  }
}
