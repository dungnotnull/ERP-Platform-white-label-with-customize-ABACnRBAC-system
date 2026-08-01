import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceFilterInput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort, DeviceFilterInput as PortFilterInput } from '@/domains/asset/application/ports/repositories/device.repository.port';
import _ from 'lodash';

export interface ExportDevicesInput {
  filter?: DeviceFilterInput;
}

export interface ExportDeviceRow {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  deviceTypeId: string;
  deviceStatusId: string;
  supplierId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiryDate?: string;
  notes: string;
  isDeleted: boolean;
  assignedTo?: string;
}

export type ExportDevicesOutput = ExportDeviceRow[];

@Injectable()
export class ExportDevicesUseCase implements IUseCase<ExportDevicesInput, ExportDevicesOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: ExportDevicesInput): Promise<ExportDevicesOutput> {
    const filter: PortFilterInput = {
      ...(input.filter?.search !== undefined && { search: input.filter.search }),
      ...(input.filter?.deviceTypeId !== undefined && { deviceTypeId: input.filter.deviceTypeId }),
      ...(input.filter?.deviceStatusId !== undefined && { deviceStatusId: input.filter.deviceStatusId }),
      ...(input.filter?.supplierId !== undefined && { supplierId: input.filter.supplierId }),
      ...(input.filter?.isDeleted !== undefined && { isDeleted: input.filter.isDeleted }),
    };

    const devices = await this.deviceRepository.findForExport(filter);

    return devices.map((device) => {
      const plain = device.toPlainObject();
      return {
        id: plain.id as string,
        name: plain.name as string,
        serialNumber: plain.serialNumber as string,
        model: plain.model as string,
        manufacturer: plain.manufacturer as string,
        deviceTypeId: plain.deviceTypeId as string,
        deviceStatusId: plain.deviceStatusId as string,
        supplierId: plain.supplierId as string | undefined,
        purchaseDate: plain.purchaseDate ? new Date(plain.purchaseDate as Date).toISOString() : undefined,
        purchasePrice: plain.purchasePrice as number | undefined,
        warrantyExpiryDate: plain.warrantyExpiryDate ? new Date(plain.warrantyExpiryDate as Date).toISOString() : undefined,
        notes: plain.notes as string,
        isDeleted: plain.isDeleted as boolean,
        assignedTo: (plain.currentAssignment as unknown as Record<string, unknown> | null)?.userName as string | undefined,
      };
    });
  }
}
