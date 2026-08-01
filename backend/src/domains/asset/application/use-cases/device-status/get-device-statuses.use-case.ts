import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceStatusOutput } from '@/domains/asset/application/dtos/device-status.dtos';
import { DeviceStatusRepositoryPort } from '@/domains/asset/application/ports/repositories/device-status.repository.port';

@Injectable()
export class GetDeviceStatusesUseCase implements IUseCase<void, DeviceStatusOutput[]> {
  constructor(
    @Inject('DeviceStatusRepositoryPort') private readonly deviceStatusRepository: DeviceStatusRepositoryPort,
  ) {}

  async execute(): Promise<DeviceStatusOutput[]> {
    const statuses = await this.deviceStatusRepository.findAll();

    return statuses.map((s) => s.toPlainObject() as unknown as DeviceStatusOutput);
  }
}
