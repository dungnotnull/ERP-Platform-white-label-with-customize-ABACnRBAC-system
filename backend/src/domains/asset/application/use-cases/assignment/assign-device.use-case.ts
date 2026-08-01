import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { AssignDeviceInput, AssignmentOutput } from '@/domains/asset/application/dtos/assignment.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { InternalUserCheckingPort } from '@/domains/asset/application/ports/services/internal-user-checking.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';
import { DeviceNotAssignableException } from '@/domains/asset/domain/exceptions/device-not-assignable.exception';
import { DeviceAssignmentPolicy } from '@/domains/asset/domain/services/device-assignment-policy';
import { DeviceStatusRepositoryPort } from '../../ports/repositories/device-status.repository.port';
import { DeviceStatusEnum } from "@/shared/domain/enums/device.enum";
import { InternalUserDeviceSummarySyncPort } from '@/domains/asset/application/ports/services/internal-user-device-summary-sync.port';

@Injectable()
export class AssignDeviceUseCase implements IUseCase<AssignDeviceInput, AssignmentOutput> {
  private readonly assignmentPolicy = new DeviceAssignmentPolicy();

  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
    @Inject('InternalUserCheckingPort') private readonly userCheckingPort: InternalUserCheckingPort,
    @Inject('DeviceStatusRepositoryPort') private readonly deviceStatusRepository: DeviceStatusRepositoryPort,
    @Inject('InternalUserDeviceSummarySyncPort')
    private readonly deviceSummarySyncPort: InternalUserDeviceSummarySyncPort,
  ) {}

  async execute(input: AssignDeviceInput): Promise<AssignmentOutput> {
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new DeviceNotFoundException(input.deviceId);
    }

    const handedOverStatus =
      await this.deviceStatusRepository.findByName(DeviceStatusEnum.HANDED_OVER);

    if (!handedOverStatus) {
      throw new Error('handed_over status not found');
    }

    const currentStatus = await this.deviceStatusRepository.findById(
      device.deviceStatusId,
    );

    if (!currentStatus) {
      throw new DeviceNotAssignableException(input.deviceId, 'current status not found');
    }

    this.assignmentPolicy.validateAssignable(device, currentStatus.name);

    await this.userCheckingPort.ensureUserExists(input.userId);

    device.assignTo(input.userId, input.userName, input.assignedBy);

    device.updateStatus(handedOverStatus.id, device.toPlainObject().deviceStatusId as string, input.assignedBy, );

    await this.deviceRepository.save(device);
    await this.deviceSummarySyncPort.refreshForUser(input.userId);

    const plain = device.toPlainObject();
    return {
      id: plain.id as string,
      currentAssignment: plain.currentAssignment as unknown as Record<string, unknown> | null,
      assignmentHistory: plain.assignmentHistory as unknown as Record<string, unknown>[],
      transactions: plain.transactions as unknown as Record<string, unknown>[],
    };
  }
}
