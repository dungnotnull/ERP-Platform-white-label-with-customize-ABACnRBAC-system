import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateMaintenanceInput, MaintenanceOutput } from '@/domains/asset/application/dtos/maintenance.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';
import { DeviceMaintenanceVo } from '@/domains/asset/domain/value-objects/device-maintenance.vo';

@Injectable()
export class UpdateMaintenanceUseCase implements IUseCase<UpdateMaintenanceInput, MaintenanceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: UpdateMaintenanceInput): Promise<MaintenanceOutput> {
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new DeviceNotFoundException(input.deviceId);
    }

    const records = device.maintenanceRecords;
    if (input.maintenanceIndex < 0 || input.maintenanceIndex >= records.length) {
      throw new Error(`Maintenance record at index ${input.maintenanceIndex} not found`);
    }

    const existing = records[input.maintenanceIndex];
    const updatedRecord = new DeviceMaintenanceVo({
      maintenanceType: input.maintenanceType ?? existing.maintenanceType,
      status: input.status ?? existing.status,
      scheduledDate: input.scheduledDate ?? existing.scheduledDate,
      cost: input.cost ?? existing.cost,
      description: input.description ?? existing.description,
    });

    device.updateMaintenanceRecord(input.maintenanceIndex, updatedRecord);

    await this.deviceRepository.save(device);

    const plain = device.toPlainObject();
    return {
      id: plain.id as string,
      maintenanceRecords: plain.maintenanceRecords as unknown as Record<string, unknown>[],
      transactions: plain.transactions as unknown as Record<string, unknown>[],
    };
  }
}
