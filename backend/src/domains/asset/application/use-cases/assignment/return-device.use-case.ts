import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';

import {
  ReturnDeviceInput,
  AssignmentOutput,
} from '@/domains/asset/application/dtos/assignment.dtos';

import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceStatusRepositoryPort } from '@/domains/asset/application/ports/repositories/device-status.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';
import { DeviceNotReturnableException } from '@/domains/asset/domain/exceptions/device-not-returnable.exception';
import { InternalUserDeviceSummarySyncPort } from '@/domains/asset/application/ports/services/internal-user-device-summary-sync.port';
import { DeviceAssignmentPolicy } from '@/domains/asset/domain/services/device-assignment-policy';

@Injectable()
export class ReturnDeviceUseCase
  implements IUseCase<ReturnDeviceInput, AssignmentOutput>
{
  private readonly assignmentPolicy = new DeviceAssignmentPolicy();

  constructor(
    @Inject('DeviceRepositoryPort')
    private readonly deviceRepository: DeviceRepositoryPort,

    @Inject('DeviceStatusRepositoryPort')
    private readonly deviceStatusRepository: DeviceStatusRepositoryPort,

    @Inject('InternalUserDeviceSummarySyncPort')
    private readonly deviceSummarySyncPort: InternalUserDeviceSummarySyncPort,
  ) {}

  async execute(
    input: ReturnDeviceInput,
  ): Promise<AssignmentOutput> {
    const device = await this.deviceRepository.findById(
      input.deviceId,
    );

    if (!device) {
      throw new DeviceNotFoundException(input.deviceId);
    }

    const availableStatus =
      await this.deviceStatusRepository.findByName(
        'usable',
      );

    if (!availableStatus) {
      throw new Error('usable status not found');
    }

    const currentStatus = await this.deviceStatusRepository.findById(
      device.deviceStatusId,
    );

    if (!currentStatus) {
      throw new DeviceNotReturnableException(input.deviceId, 'current status not found');
    }

    this.assignmentPolicy.validateReturnable(device, currentStatus.name);

    const assignedUserId = device.currentAssignment?.userId ?? null;

    device.returnDevice(input.returnedBy);

    device.updateStatus(
      availableStatus.id,
      device.toPlainObject().deviceStatusId as string,
      input.returnedBy,
    );

    if (input.notes?.trim()) {
      device.updateFields({
        notes: input.notes,
        updatedBy: input.returnedBy,
      });
    }

    await this.deviceRepository.save(device);

    if (assignedUserId) {
      await this.deviceSummarySyncPort.refreshForUser(assignedUserId);
    }

    const plain = device.toPlainObject();

    return {
      id: plain.id as string,

      currentAssignment:
        plain.currentAssignment as unknown as Record<
          string,
          unknown
        > | null,

      assignmentHistory:
        plain.assignmentHistory as unknown as Record<
          string,
          unknown
        >[],

      transactions:
        plain.transactions as unknown as Record<
          string,
          unknown
        >[],
    };
  }
}