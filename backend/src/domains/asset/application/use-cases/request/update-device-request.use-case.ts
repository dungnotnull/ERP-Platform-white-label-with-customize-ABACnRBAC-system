import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateDeviceRequestInput, DeviceRequestOutput } from '@/domains/asset/application/dtos/request.dtos';
import { DeviceRequestItemVo } from '@/domains/asset/domain/value-objects/device-request-item.vo';
import { DeviceRequestDeviceVo } from '@/domains/asset/domain/value-objects/device-request-device.vo';
import { DeviceRequestRepositoryPort } from '@/domains/asset/application/ports/repositories/device-request.repository.port';
import { DeviceRequestNotFoundException } from '@/domains/asset/domain/exceptions/device-request-not-found.exception';
import { DeviceRequestStatusEnum } from '@/shared/domain/enums/device.enum';

@Injectable()
export class UpdateDeviceRequestUseCase implements IUseCase<UpdateDeviceRequestInput, DeviceRequestOutput> {
  constructor(
    @Inject('DeviceRequestRepositoryPort') private readonly deviceRequestRepository: DeviceRequestRepositoryPort,
  ) {}

  async execute(input: UpdateDeviceRequestInput): Promise<DeviceRequestOutput> {
    const request = await this.deviceRequestRepository.findById(input.id);
    if (!request) {
      throw new DeviceRequestNotFoundException(input.id);
    }

    if (request.status !== DeviceRequestStatusEnum.PENDING) {
      throw new Error('Only pending requests can be updated');
    }

    request.updateFields({
      ...(input.type !== undefined && { type: input.type }),
      ...(input.reason !== undefined && { reason: input.reason }),
      ...(input.items !== undefined && {
        items: input.items.map((item) => new DeviceRequestItemVo({ deviceTypeId: item.deviceTypeId, quantity: item.quantity })),
      }),
      ...(input.replacementDevices !== undefined && {
        replacementDevices: input.replacementDevices.map(
          (d) => new DeviceRequestDeviceVo({ oldDeviceId: d.oldDeviceId, newDeviceId: d.newDeviceId }),
        ),
      }),
    });

    await this.deviceRequestRepository.save(request);

    return request.toPlainObject() as unknown as DeviceRequestOutput;
  }
}
