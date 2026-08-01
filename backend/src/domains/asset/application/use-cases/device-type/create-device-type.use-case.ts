import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateDeviceTypeInput, DeviceTypeOutput } from '@/domains/asset/application/dtos/device-type.dtos';
import { DeviceTypeEntity } from '@/domains/asset/domain/entities/device-type.entity';
import { DeviceTypeRepositoryPort } from '@/domains/asset/application/ports/repositories/device-type.repository.port';

@Injectable()
export class CreateDeviceTypeUseCase implements IUseCase<CreateDeviceTypeInput, DeviceTypeOutput> {
  constructor(
    @Inject('DeviceTypeRepositoryPort') private readonly deviceTypeRepository: DeviceTypeRepositoryPort,
  ) {}

  async execute(input: CreateDeviceTypeInput): Promise<DeviceTypeOutput> {
    const existing = await this.deviceTypeRepository.findByName(input.name);
    if (existing) {
      throw new Error(`Device type with name "${input.name}" already exists`);
    }

    const deviceType = DeviceTypeEntity.create('', {
      name: input.name,
      description: input.description ?? '',
      isActive: input.isActive ?? true,
    });

    const saved = await this.deviceTypeRepository.save(deviceType);

    return saved.toPlainObject() as unknown as DeviceTypeOutput;
  }
}
