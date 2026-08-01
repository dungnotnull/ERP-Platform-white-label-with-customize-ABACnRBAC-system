import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateMaintenanceInput, MaintenanceOutput } from '@/domains/asset/application/dtos/maintenance.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';
import { DeviceMaintenanceVo } from '@/domains/asset/domain/value-objects/device-maintenance.vo';

@Injectable()
export class CreateMaintenanceUseCase implements IUseCase<CreateMaintenanceInput, MaintenanceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: CreateMaintenanceInput): Promise<MaintenanceOutput> {
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new DeviceNotFoundException(input.deviceId);
    }

    const maintenanceRecord = new DeviceMaintenanceVo({
      maintenanceType: input.maintenanceType,
      status: input.status,
      scheduledDate: input.scheduledDate,
      ...(input.cost !== undefined && { cost: input.cost }),
      ...(input.description !== undefined && { description: input.description }),
    });

    device.addMaintenance(maintenanceRecord);

    await this.deviceRepository.save(device);

    const plain = device.toPlainObject();
    return {
      id: plain.id as string,
      maintenanceRecords: plain.maintenanceRecords as unknown as Record<string, unknown>[],
      transactions: plain.transactions as unknown as Record<string, unknown>[],
    };
  }
}
