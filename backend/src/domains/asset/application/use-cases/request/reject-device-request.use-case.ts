import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRequestOutput } from '@/domains/asset/application/dtos/request.dtos';
import { DeviceRequestRepositoryPort } from '@/domains/asset/application/ports/repositories/device-request.repository.port';
import { DeviceRequestNotFoundException } from '@/domains/asset/domain/exceptions/device-request-not-found.exception';

export interface RejectRequestInput {
  id: string;
  rejectedBy: string;
}

@Injectable()
export class RejectDeviceRequestUseCase implements IUseCase<RejectRequestInput, DeviceRequestOutput> {
  constructor(
    @Inject('DeviceRequestRepositoryPort') private readonly deviceRequestRepository: DeviceRequestRepositoryPort,
  ) {}

  async execute(input: RejectRequestInput): Promise<DeviceRequestOutput> {
    const request = await this.deviceRequestRepository.findById(input.id);
    if (!request) {
      throw new DeviceRequestNotFoundException(input.id);
    }

    request.reject(input.rejectedBy);

    await this.deviceRequestRepository.save(request);

    return request.toPlainObject() as unknown as DeviceRequestOutput;
  }
}
