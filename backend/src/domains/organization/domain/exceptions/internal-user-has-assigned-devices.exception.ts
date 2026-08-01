import { DomainException } from './domain.exception';

export class InternalUserHasAssignedDevicesException extends DomainException {
  constructor(count: number) {
    super(
      `Cannot delete employee: ${count} device(s) are still assigned`,
      409,
      'INTERNAL_USER_HAS_DEVICES',
      { count: String(count) },
    );
  }
}
