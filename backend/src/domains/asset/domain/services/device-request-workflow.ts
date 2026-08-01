import { DeviceRequestStatusEnum, DeviceRequestStatusEnumType } from '@/shared/domain/enums/device.enum';

const VALID_TRANSITIONS: Record<DeviceRequestStatusEnumType, DeviceRequestStatusEnumType[]> = {
  [DeviceRequestStatusEnum.PENDING]: [
    DeviceRequestStatusEnum.APPROVED,
    DeviceRequestStatusEnum.REJECTED,
    DeviceRequestStatusEnum.CANCELLED,
  ],
  [DeviceRequestStatusEnum.APPROVED]: [
    DeviceRequestStatusEnum.COMPLETED,
    DeviceRequestStatusEnum.CANCELLED,
  ],
  [DeviceRequestStatusEnum.REJECTED]: [],
  [DeviceRequestStatusEnum.COMPLETED]: [],
  [DeviceRequestStatusEnum.CANCELLED]: [],
};

export class DeviceRequestWorkflow {
  public canTransitionFrom(
    currentStatus: DeviceRequestStatusEnumType,
    targetStatus: DeviceRequestStatusEnumType,
  ): boolean {
    const allowedTargets = VALID_TRANSITIONS[currentStatus];
    return allowedTargets?.includes(targetStatus) ?? false;
  }

  public getAllowedTransitions(currentStatus: DeviceRequestStatusEnumType): DeviceRequestStatusEnumType[] {
    return VALID_TRANSITIONS[currentStatus] ?? [];
  }
}
