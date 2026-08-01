import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRequestOutput, PaginatedRequestsOutput } from '@/domains/asset/application/dtos/request.dtos';
import { DeviceRequestRepositoryPort, DeviceRequestFilterInput as PortFilterInput } from '@/domains/asset/application/ports/repositories/device-request.repository.port';

export interface GetDeviceRequestsInput {
  filter?: {
    search?: string;
    status?: string;
    type?: string;
    userId?: string;
    requestedByUserId?: string;
  };
  page?: number;
  limit?: number;
}

@Injectable()
export class GetDeviceRequestsUseCase implements IUseCase<GetDeviceRequestsInput, PaginatedRequestsOutput> {
  constructor(
    @Inject('DeviceRequestRepositoryPort') private readonly deviceRequestRepository: DeviceRequestRepositoryPort,
  ) {}

  async execute(input: GetDeviceRequestsInput): Promise<PaginatedRequestsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const filter: PortFilterInput = {
      ...(input.filter?.search !== undefined && { search: input.filter.search }),
      ...(input.filter?.status !== undefined && { status: input.filter.status }),
      ...(input.filter?.type !== undefined && { type: input.filter.type }),
      ...(input.filter?.userId !== undefined && { userId: input.filter.userId }),
      ...(input.filter?.requestedByUserId !== undefined && { requestedByUserId: input.filter.requestedByUserId }),
    };

    const result = await this.deviceRequestRepository.findPaginated(filter, page, limit);

    return {
      items: result.items.map((request) => request.toPlainObject() as unknown as DeviceRequestOutput),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
