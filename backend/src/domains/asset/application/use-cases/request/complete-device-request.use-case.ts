import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRequestOutput } from '@/domains/asset/application/dtos/request.dtos';
import { DeviceRequestRepositoryPort } from '@/domains/asset/application/ports/repositories/device-request.repository.port';
import { DeviceRequestNotFoundException } from '@/domains/asset/domain/exceptions/device-request-not-found.exception';

@Injectable()
export class CompleteDeviceRequestUseCase implements IUseCase<string, DeviceRequestOutput> {
  constructor(
    @Inject('DeviceRequestRepositoryPort') private readonly deviceRequestRepository: DeviceRequestRepositoryPort,
  ) {}

  async execute(id: string): Promise<DeviceRequestOutput> {
    const request = await this.deviceRequestRepository.findById(id);
    if (!request) {
      throw new DeviceRequestNotFoundException(id);
    }

    request.complete();

    await this.deviceRequestRepository.save(request);

    return request.toPlainObject() as unknown as DeviceRequestOutput;
  }
}
