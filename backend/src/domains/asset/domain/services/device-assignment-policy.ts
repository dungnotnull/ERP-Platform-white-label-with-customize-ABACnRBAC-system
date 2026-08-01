import { DeviceStatusEnum } from '@/shared/domain/enums/device.enum';
import { DeviceAlreadyAssignedException } from '../exceptions/device-already-assigned.exception';
import { DeviceNotAssignableException } from '../exceptions/device-not-assignable.exception';
import { DeviceNotReturnableException } from '../exceptions/device-not-returnable.exception';

export class DeviceAssignmentPolicy {
  public canAssign(device: { currentAssignment: unknown }): boolean {
    return device.currentAssignment === null;
  }

  public validateAssignment(device: { currentAssignment: unknown; id: string }): void {
    if (device.currentAssignment !== null) {
      throw new DeviceAlreadyAssignedException(device.id);
    }
  }

  public validateAssignable(
    device: { currentAssignment: unknown; id: string },
    currentStatusName: string,
  ): void {
    const normalizedStatus = currentStatusName.trim().toLowerCase();

    if (normalizedStatus !== DeviceStatusEnum.USABLE) {
      throw new DeviceNotAssignableException(
        device.id,
        'device must be in usable status',
      );
    }

    this.validateAssignment(device);
  }

  public validateReturnable(
    device: { currentAssignment: unknown; id: string },
    currentStatusName: string,
  ): void {
    const normalizedStatus = currentStatusName.trim().toLowerCase();

    if (normalizedStatus !== DeviceStatusEnum.HANDED_OVER) {
      throw new DeviceNotReturnableException(
        device.id,
        'device must be in handed_over status',
      );
    }

    if (device.currentAssignment === null) {
      throw new DeviceNotReturnableException(
        device.id,
        'device is not currently assigned',
      );
    }
  }
}
