import { Inject, Injectable } from '@nestjs/common';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceCreationPort, DeviceCreationItem } from '@/domains/organization/application/ports/services/device-creation.port';
import { v4 as uuidv4 } from 'uuid';
import { DeviceEntity } from '@/domains/asset/domain/entities/device.entity';

@Injectable()
export class DeviceCreationAdapter implements DeviceCreationPort {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async createDevicesFromPurchaseOrder(items: DeviceCreationItem[]): Promise<string[]> {
    const createdIds: string[] = [];

    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const serialNumber = `PO-${uuidv4().substring(0, 8).toUpperCase()}`;
        const device = DeviceEntity.create('', {
          name: item.deviceName,
          serialNumber,
          model: '',
          manufacturer: '',
          deviceTypeId: item.deviceTypeId,
          deviceStatusId: '',
          notes: `Created from purchase order`,
          isDeleted: false,
          currentAssignment: null,
          assignmentHistory: [],
          maintenanceRecords: [],
          transactions: [],
          purchasePrice: item.unitPrice,
        });
        const saved = await this.deviceRepository.save(device);
        createdIds.push(saved.id);
      }
    }

    return createdIds;
  }
}
