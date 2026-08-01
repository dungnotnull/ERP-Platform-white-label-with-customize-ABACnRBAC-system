import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceTypeOutput } from '@/domains/asset/application/dtos/device-type.dtos';
import { DeviceTypeRepositoryPort } from '@/domains/asset/application/ports/repositories/device-type.repository.port';

@Injectable()
export class GetDeviceTypesUseCase implements IUseCase<void, DeviceTypeOutput[]> {
  constructor(
    @Inject('DeviceTypeRepositoryPort') private readonly deviceTypeRepository: DeviceTypeRepositoryPort,
  ) {}

  async execute(): Promise<DeviceTypeOutput[]> {
    const deviceTypes = await this.deviceTypeRepository.findAll();

    return deviceTypes.map((dt) => dt.toPlainObject() as unknown as DeviceTypeOutput);
  }
}
