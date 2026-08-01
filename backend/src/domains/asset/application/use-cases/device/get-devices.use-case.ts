import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PaginatedDevicesOutput, DeviceFilterInput } from '@/domains/asset/application/dtos/device.dtos';
import { DeviceRepositoryPort, DeviceFilterInput as PortFilterInput } from '@/domains/asset/application/ports/repositories/device.repository.port';

export interface GetDevicesInput {
  filter?: DeviceFilterInput;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable()
export class GetDevicesUseCase implements IUseCase<GetDevicesInput, PaginatedDevicesOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: GetDevicesInput): Promise<PaginatedDevicesOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const sort = input.sort ?? "updatedAt";
    const order = input.order ?? "desc";

    const filter: PortFilterInput = {
      ...(input.filter?.search !== undefined && { search: input.filter.search }),
      ...(input.filter?.deviceTypeId !== undefined && { deviceTypeId: input.filter.deviceTypeId }),
      ...(input.filter?.deviceStatusId !== undefined && { deviceStatusId: input.filter.deviceStatusId }),
      ...(input.filter?.supplierId !== undefined && { supplierId: input.filter.supplierId }),
      ...(input.filter?.isDeleted !== undefined && { isDeleted: input.filter.isDeleted }),
      ...(input.filter?.assignedUserId !== undefined && { assignedUserId: input.filter.assignedUserId }),
      ...(input.filter?.sort !== undefined && { sort: input.filter.sort }),
      ...(input.filter?.order !== undefined && { order: input.filter.order }),
    };

    const result = await this.deviceRepository.findPaginated(
      {
        ...filter,
        sort: sort,
        order: order,
      },
      page,
      limit,
    );

    return {
      items: result.items.map((device) => device.toPlainObject() as unknown as PaginatedDevicesOutput['items'][number]),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
