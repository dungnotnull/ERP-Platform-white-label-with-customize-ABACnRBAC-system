import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateDeviceInput, DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceNotFoundException } from '@/domains/asset/domain/exceptions/device-not-found.exception';

@Injectable()
export class UpdateDeviceUseCase implements IUseCase<UpdateDeviceInput, DeviceOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: UpdateDeviceInput): Promise<DeviceOutput> {
    const device = await this.deviceRepository.findById(input.id);
    if (!device) {
      throw new DeviceNotFoundException(input.id);
    }

    // ✅ Normalize dữ liệu
    const normalizedInput = {
      ...input,

      ...(input.name !== undefined && {
        name: input.name?.trim(),
      }),

      ...(input.model !== undefined && {
        model: input.model?.trim(),
      }),

      ...(input.manufacturer !== undefined && {
        manufacturer: input.manufacturer?.trim(),
      }),

      ...(input.serialNumber !== undefined && {
        serialNumber: input.serialNumber.trim().toUpperCase(),
      }),

      ...(input.notes !== undefined && {
        notes: input.notes?.trim(),
      }),
    };

    // ✅ Validate serial number nếu có thay đổi
    if (input.serialNumber) {
      const exists =
        await this.deviceRepository.existsBySerialNumberExcludeId(
          input.serialNumber.trim().toUpperCase(),
          input.id,
        );

      if (exists) {
        const serialNumber = input.serialNumber.trim().toUpperCase();
        throw new BadRequestException({
          errorCode: 'DEVICE_DUPLICATE_SERIAL',
          params: { serialNumber },
          message: `Device with serial number "${serialNumber}" already exists`,
        });
      }
    }

    device.updateFields({
      ...(normalizedInput.name !== undefined && {
        name: normalizedInput.name,
      }),

      ...(normalizedInput.serialNumber !== undefined && {
        serialNumber: normalizedInput.serialNumber,
      }),

      ...(normalizedInput.model !== undefined && {
        model: normalizedInput.model,
      }),

      ...(normalizedInput.manufacturer !== undefined && {
        manufacturer: normalizedInput.manufacturer,
      }),

      ...(normalizedInput.deviceTypeId !== undefined && {
        deviceTypeId: normalizedInput.deviceTypeId,
      }),

      ...(normalizedInput.deviceStatusId !== undefined && {
        deviceStatusId: normalizedInput.deviceStatusId,
      }),

      ...(normalizedInput.supplierId !== undefined && {
        supplierId: normalizedInput.supplierId,
      }),

      ...(normalizedInput.purchaseDate !== undefined && {
        purchaseDate: normalizedInput.purchaseDate,
      }),

      ...(normalizedInput.purchasePrice !== undefined && {
        purchasePrice: normalizedInput.purchasePrice,
      }),

      ...(normalizedInput.warrantyExpiryDate !== undefined && {
        warrantyExpiryDate: normalizedInput.warrantyExpiryDate,
      }),

      ...(normalizedInput.notes !== undefined && {
        notes: normalizedInput.notes,
      }),

      ...(normalizedInput.updatedBy !== undefined && {
        updatedBy: normalizedInput.updatedBy,
      }),
    });

    await this.deviceRepository.save(device);

    return device.toPlainObject() as unknown as unknown as DeviceOutput;
  }
}
