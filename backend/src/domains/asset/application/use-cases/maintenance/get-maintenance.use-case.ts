import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';

export interface GetMaintenanceInput {
  deviceId: string;
}

export interface MaintenanceRecordOutput {
  maintenanceType: string;
  status: string;
  scheduledDate: Date;
  cost?: number;
  description?: string;
}

export interface GetMaintenanceOutput {
  deviceId: string;
  records: MaintenanceRecordOutput[];
}

@Injectable()
export class GetMaintenanceUseCase implements IUseCase<GetMaintenanceInput, GetMaintenanceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: GetMaintenanceInput): Promise<GetMaintenanceOutput> {
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new DeviceNotFoundException(input.deviceId);
    }

    return {
      deviceId: device.id,
      records: device.maintenanceRecords.map((r) => r.toPlainObject() as MaintenanceRecordOutput),
    };
  }
}
