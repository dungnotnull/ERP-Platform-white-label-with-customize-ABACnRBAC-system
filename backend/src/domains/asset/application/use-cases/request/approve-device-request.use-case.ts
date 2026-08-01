import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { ApproveRequestInput, DeviceRequestOutput } from '@/domains/asset/application/dtos/request.dtos';
import { DeviceRequestRepositoryPort } from '@/domains/asset/application/ports/repositories/device-request.repository.port';
import { DeviceRequestNotFoundException } from '@/domains/asset/domain/exceptions/device-request-not-found.exception';

@Injectable()
export class ApproveDeviceRequestUseCase implements IUseCase<ApproveRequestInput, DeviceRequestOutput> {
  constructor(
    @Inject('DeviceRequestRepositoryPort') private readonly deviceRequestRepository: DeviceRequestRepositoryPort,
  ) {}

  async execute(input: ApproveRequestInput): Promise<DeviceRequestOutput> {
    const request = await this.deviceRequestRepository.findById(input.id);
    if (!request) {
      throw new DeviceRequestNotFoundException(input.id);
    }

    request.approve(input.approvedBy);

    await this.deviceRequestRepository.save(request);

    return request.toPlainObject() as unknown as DeviceRequestOutput;
  }
}
