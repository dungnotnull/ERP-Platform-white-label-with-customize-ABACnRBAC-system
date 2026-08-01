import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateDeviceInput, DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceEntity } from '@/domains/asset/domain/entities/device.entity';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';

@Injectable()
export class CreateDeviceUseCase implements IUseCase<CreateDeviceInput, DeviceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: CreateDeviceInput): Promise<DeviceOutput> {

    const normalizedInput = {
      ...input,

      name: input.name?.trim(),

      serialNumber: input.serialNumber
        ?.trim()
        .toUpperCase(),

      model: input.model?.trim() ?? '',

      manufacturer: input.manufacturer?.trim() ?? '',

      notes: input.notes?.trim() ?? '',
    };

    const exists = await this.deviceRepository.existsBySerialNumber(
      normalizedInput.serialNumber,
    );

    if (exists) {
      throw new BadRequestException({
        errorCode: 'DEVICE_DUPLICATE_SERIAL',
        params: { serialNumber: normalizedInput.serialNumber },
        message: `Device with serial number "${normalizedInput.serialNumber}" already exists`,
      });
    }

    const device = DeviceEntity.create('', {
      name: normalizedInput.name,
      serialNumber: normalizedInput.serialNumber,
      model: normalizedInput.model,
      manufacturer: normalizedInput.manufacturer,
      deviceTypeId: normalizedInput.deviceTypeId,
      deviceStatusId: normalizedInput.deviceStatusId,
      supplierId: normalizedInput.supplierId,
      purchaseDate: normalizedInput.purchaseDate,
      purchasePrice: normalizedInput.purchasePrice,
      warrantyExpiryDate: normalizedInput.warrantyExpiryDate,
      notes: normalizedInput.notes,
      isDeleted: false,
      currentAssignment: null,
      assignmentHistory: [],
      maintenanceRecords: [],
      transactions: [],
      createdBy: normalizedInput.createdBy,
    });

    const saved = await this.deviceRepository.save(device);

    return saved.toPlainObject() as unknown as unknown as DeviceOutput;
  }

}
