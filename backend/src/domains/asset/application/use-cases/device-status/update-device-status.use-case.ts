import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateDeviceStatusInput, DeviceStatusOutput } from '@/domains/asset/application/dtos/device-status.dtos';
import { DeviceStatusRepositoryPort } from '@/domains/asset/application/ports/repositories/device-status.repository.port';

@Injectable()
export class UpdateDeviceStatusUseCase implements IUseCase<UpdateDeviceStatusInput, DeviceStatusOutput> {
  constructor(
    @Inject('DeviceStatusRepositoryPort') private readonly deviceStatusRepository: DeviceStatusRepositoryPort,
  ) {}

  async execute(input: UpdateDeviceStatusInput): Promise<DeviceStatusOutput> {
    const deviceStatus = await this.deviceStatusRepository.findById(input.id);
    if (!deviceStatus) {
      throw new Error(`Device status with id "${input.id}" not found`);
    }

    if (input.name !== undefined) {
      const existing = await this.deviceStatusRepository.findByName(input.name);
      if (existing && existing.id !== input.id) {
        throw new Error(`Device status with name "${input.name}" already exists`);
      }
    }

    deviceStatus.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    await this.deviceStatusRepository.save(deviceStatus);

    return deviceStatus.toPlainObject() as unknown as DeviceStatusOutput;
  }
}
