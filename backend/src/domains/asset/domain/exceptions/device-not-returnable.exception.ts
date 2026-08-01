import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DeviceNotReturnableException extends DomainException {
  constructor(deviceId: string, reason?: string) {
    super(
      reason
        ? `Device "${deviceId}" cannot be returned: ${reason}`
        : `Device "${deviceId}" cannot be returned`,
      400,
      'DEVICE_NOT_RETURNABLE',
      { deviceId },
    );
  }
}
