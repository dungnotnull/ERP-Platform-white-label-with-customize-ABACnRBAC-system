import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';

@Injectable()
export class GetDeviceUseCase implements IUseCase<string, DeviceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(id: string): Promise<DeviceOutput> {
    const device = await this.deviceRepository.findById(id);
    if (!device) {
      throw new DeviceNotFoundException(id);
    }

    return device.toPlainObject() as unknown as unknown as DeviceOutput;
  }
}
