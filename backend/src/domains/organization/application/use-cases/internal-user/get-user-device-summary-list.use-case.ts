import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceTypeRepositoryPort } from '@/domains/asset/application/ports/repositories/device-type.repository.port';

export interface GetUserDeviceSummaryListInput {
  userId: string;
  page?: number;
  limit?: number;
}

export interface UserDeviceSummaryItem {
  type: string;
  name: string;
  serialNumber: string;
  model: string;
  assignedAt?: Date;
}

export interface GetUserDeviceSummaryListOutput {
  items: UserDeviceSummaryItem[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetUserDeviceSummaryListUseCase
  implements IUseCase<GetUserDeviceSummaryListInput, GetUserDeviceSummaryListOutput>
{
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
    @Inject('DeviceTypeRepositoryPort') private readonly deviceTypeRepository: DeviceTypeRepositoryPort,
  ) {}

  async execute(input: GetUserDeviceSummaryListInput): Promise<GetUserDeviceSummaryListOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 100;

    const result = await this.deviceRepository.findPaginated(
      { assignedUserId: input.userId },
      page,
      limit,
    );

    const typeCache = new Map<string, string>();

    const items: UserDeviceSummaryItem[] = await Promise.all(
      result.items.map(async (device) => {
        let typeName = typeCache.get(device.deviceTypeId);
        if (!typeName) {
          const deviceType = await this.deviceTypeRepository.findById(device.deviceTypeId);
          typeName = deviceType?.name ?? '';
          typeCache.set(device.deviceTypeId, typeName);
        }

        const assignment = device.currentAssignment;

        return {
          type: typeName,
          name: device.name,
          serialNumber: device.serialNumber,
          model: device.model,
          assignedAt: assignment?.assignedAt,
        };
      }),
    );

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
