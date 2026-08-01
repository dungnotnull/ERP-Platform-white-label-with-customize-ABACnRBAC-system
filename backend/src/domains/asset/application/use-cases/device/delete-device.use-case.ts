import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';
import { DeviceStatusRepositoryPort } from '../../ports/repositories/device-status.repository.port';

@Injectable()
export class DeleteDeviceUseCase implements IUseCase<string, DeviceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
    @Inject('DeviceStatusRepositoryPort') private readonly deviceStatusRepository: DeviceStatusRepositoryPort,
  ) {}

  async execute(id: string): Promise<DeviceOutput> {
    const device = await this.deviceRepository.findById(id);
    if (!device) {
      throw new DeviceNotFoundException(id);
    }

    const status = await this.deviceStatusRepository.findById(
      device.deviceStatusId,
    );

    if (
      status?.name === 'handed_over' ||
      device.currentAssignment?.userId
    ) {
      throw new BadRequestException({
        errorCode: 'DEVICE_DELETE_ASSIGNED',
        message: 'Cannot delete a device that is currently assigned to a user.',
      });
    }

    // device.markAsDeleted();
    // await this.deviceRepository.save(device);

    await this.deviceRepository.delete(id);

    return device.toPlainObject() as unknown as unknown as DeviceOutput;
  }
}
