import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateDeviceTypeInput, DeviceTypeOutput } from '@/domains/asset/application/dtos/device-type.dtos';
import { DeviceTypeRepositoryPort } from '@/domains/asset/application/ports/repositories/device-type.repository.port';

@Injectable()
export class UpdateDeviceTypeUseCase implements IUseCase<UpdateDeviceTypeInput, DeviceTypeOutput> {
  constructor(
    @Inject('DeviceTypeRepositoryPort') private readonly deviceTypeRepository: DeviceTypeRepositoryPort,
  ) {}

  async execute(input: UpdateDeviceTypeInput): Promise<DeviceTypeOutput> {
    const deviceType = await this.deviceTypeRepository.findById(input.id);
    if (!deviceType) {
      throw new Error(`Device type with id "${input.id}" not found`);
    }

    if (input.name !== undefined) {
      const existing = await this.deviceTypeRepository.findByName(input.name);
      if (existing && existing.id !== input.id) {
        throw new Error(`Device type with name "${input.name}" already exists`);
      }
    }

    deviceType.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    await this.deviceTypeRepository.save(deviceType);

    return deviceType.toPlainObject() as unknown as DeviceTypeOutput;
  }
}
