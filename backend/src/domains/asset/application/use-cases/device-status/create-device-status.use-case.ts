import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateDeviceStatusInput, DeviceStatusOutput } from '@/domains/asset/application/dtos/device-status.dtos';
import { DeviceStatusEntity } from '@/domains/asset/domain/entities/device-status.entity';
import { DeviceStatusRepositoryPort } from '@/domains/asset/application/ports/repositories/device-status.repository.port';

@Injectable()
export class CreateDeviceStatusUseCase implements IUseCase<CreateDeviceStatusInput, DeviceStatusOutput> {
  constructor(
    @Inject('DeviceStatusRepositoryPort') private readonly deviceStatusRepository: DeviceStatusRepositoryPort,
  ) {}

  async execute(input: CreateDeviceStatusInput): Promise<DeviceStatusOutput> {
    const existing = await this.deviceStatusRepository.findByName(input.name);
    if (existing) {
      throw new Error(`Device status with name "${input.name}" already exists`);
    }

    const deviceStatus = DeviceStatusEntity.create('', {
      name: input.name,
      description: input.description ?? '',
      isActive: input.isActive ?? true,
    });

    const saved = await this.deviceStatusRepository.save(deviceStatus);

    return saved.toPlainObject() as unknown as DeviceStatusOutput;
  }
}
