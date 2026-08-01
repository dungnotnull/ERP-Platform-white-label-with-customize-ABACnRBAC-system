import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceStatisticsOutput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort, DeviceFilterInput } from '@/domains/asset/application/ports/repositories/device.repository.port';
import _ from 'lodash';

@Injectable()
export class GetDeviceStatisticsUseCase implements IUseCase<void, DeviceStatisticsOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(): Promise<DeviceStatisticsOutput> {
    const allDevicesResult = await this.deviceRepository.findPaginated({}, 1, 0);

    const activeFilter: DeviceFilterInput = { isDeleted: false };
    const activeResult = await this.deviceRepository.findPaginated(activeFilter, 1, 0);

    const assignedFilter: DeviceFilterInput = { assignedUserId: 'any' };
    const assignedResult = await this.deviceRepository.findPaginated(assignedFilter, 1, 0);

    const availableCount = activeResult.total - assignedResult.total;
    const devicesByStatus = await this.deviceRepository.aggregateCountByStatus();

    return {
      totalDevices: allDevicesResult.total,
      activeDevices: activeResult.total,
      assignedDevices: assignedResult.total,
      availableDevices: Math.max(0, availableCount),
      devicesByType: {},
      devicesByStatus,
    };
  }
}
