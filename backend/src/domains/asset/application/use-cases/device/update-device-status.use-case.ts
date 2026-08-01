import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';

export interface UpdateDeviceStatusInput {
  id: string;
  newStatusId: string;
  performedBy?: string;
}

@Injectable()
export class UpdateDeviceStatusUseCase implements IUseCase<UpdateDeviceStatusInput, DeviceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
    @InjectModel('DeviceStatus') private readonly deviceStatusModel: Model<any>,
  ) {}

  async execute(input: UpdateDeviceStatusInput): Promise<DeviceOutput> {
    const device = await this.deviceRepository.findById(input.id);

    if (!device) {
      throw new DeviceNotFoundException(input.id);
    }

    const currentStatus = await this.deviceStatusModel.findById(
      device.deviceStatusId,
    );

    // if (!currentStatus) {
    //   throw new BadRequestException(
    //     'Current device status not found',
    //   );
    // }

    const newStatus = await this.deviceStatusModel.findById(
      input.newStatusId,
    );

    if (!newStatus) {
      throw new BadRequestException({
        errorCode: 'DEVICE_STATUS_INVALID',
        message: 'Invalid device status',
      });
    }

    /**
     * handed_over chỉ được cập nhật
     * thông qua Assign Device
     */
    if (newStatus.name === 'handed_over') {
      throw new BadRequestException({
        errorCode: 'DEVICE_STATUS_HANDED_OVER_ONLY_ASSIGN',
        message:
          'handed_over status can only be updated through device assignment',
      });
    }

    /**
     * Thiết bị đang được bàn giao
     * phải Return trước khi đổi trạng thái
     */
    if (currentStatus?.name === 'handed_over') {
      throw new BadRequestException({
        errorCode: 'DEVICE_STATUS_MUST_RETURN_FIRST',
        message:
          'Device is currently assigned. Please return it before changing status',
      });
    }

    const oldStatusId = device.deviceStatusId;

    device.updateStatus(
      input.newStatusId,
      oldStatusId,
      input.performedBy,
    );

    await this.deviceRepository.save(device);

    return device.toPlainObject() as unknown as DeviceOutput;
  }

}
