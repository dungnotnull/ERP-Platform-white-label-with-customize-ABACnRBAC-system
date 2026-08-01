import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateDeviceRequestInput, DeviceRequestOutput } from '@/domains/asset/application/dtos/request.dtos';
import { DeviceRequestEntity } from '@/domains/asset/domain/entities/device-request.entity';
import { DeviceRequestItemVo } from '@/domains/asset/domain/value-objects/device-request-item.vo';
import { DeviceRequestDeviceVo } from '@/domains/asset/domain/value-objects/device-request-device.vo';
import { DeviceRequestRepositoryPort } from '@/domains/asset/application/ports/repositories/device-request.repository.port';
import { DeviceRequestStatusEnum } from '@/shared/domain/enums/device.enum';

@Injectable()
export class CreateDeviceRequestUseCase implements IUseCase<CreateDeviceRequestInput, DeviceRequestOutput> {
  constructor(
    @Inject('DeviceRequestRepositoryPort') private readonly deviceRequestRepository: DeviceRequestRepositoryPort,
  ) {}

  async execute(input: CreateDeviceRequestInput): Promise<DeviceRequestOutput> {
    const items = (input.items ?? []).map(
      (item) => new DeviceRequestItemVo({ deviceTypeId: item.deviceTypeId, quantity: item.quantity }),
    );

    const replacementDevices = (input.replacementDevices ?? []).map(
      (d) => new DeviceRequestDeviceVo({ oldDeviceId: d.oldDeviceId, newDeviceId: d.newDeviceId }),
    );

    const request = DeviceRequestEntity.create('', {
      type: input.type,
      status: DeviceRequestStatusEnum.PENDING,
      userId: input.userId,
      requestedByUserId: input.requestedByUserId,
      reason: input.reason ?? '',
      items,
      replacementDevices,
    });

    const saved = await this.deviceRequestRepository.save(request);

    return saved.toPlainObject() as unknown as DeviceRequestOutput;
  }
}
