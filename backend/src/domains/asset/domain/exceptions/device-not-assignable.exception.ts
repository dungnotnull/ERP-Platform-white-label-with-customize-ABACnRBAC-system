import { DomainException } from '@/domains/identity/domain/exceptions/domain.exception';

export class DeviceNotAssignableException extends DomainException {
  constructor(deviceId: string, reason?: string) {
    super(
      reason
        ? `Device "${deviceId}" cannot be assigned: ${reason}`
        : `Device "${deviceId}" cannot be assigned`,
      400,
      'DEVICE_NOT_ASSIGNABLE',
      { deviceId },
    );
  }
}
