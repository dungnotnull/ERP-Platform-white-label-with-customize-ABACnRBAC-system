import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRepositoryPort, DeviceFilterInput, PaginatedResult } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceEntity } from '@/domains/asset/domain/entities/device.entity';

export interface GetAssignmentsInput {
  page?: number;
  limit?: number;
  assignedUserId?: string;
}

export interface AssignmentItem {
  id: string;
  name: string;
  serialNumber: string;
  currentAssignment: Record<string, unknown> | null;
  assignmentHistory: Record<string, unknown>[];
}

export interface GetAssignmentsOutput {
  items: AssignmentItem[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetAssignmentsUseCase implements IUseCase<GetAssignmentsInput, GetAssignmentsOutput> {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: GetAssignmentsInput): Promise<GetAssignmentsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const filter: DeviceFilterInput = {};
    if (input.assignedUserId) {
      filter.assignedUserId = input.assignedUserId;
    }

    const result: PaginatedResult<DeviceEntity> = await this.deviceRepository.findPaginated(filter, page, limit);

    return {
      items: result.items.map((device) => {
        const plain = device.toPlainObject();
        return {
          id: plain.id as string,
          name: plain.name as string,
          serialNumber: plain.serialNumber as string,
          currentAssignment: plain.currentAssignment as unknown as Record<string, unknown> | null,
          assignmentHistory: plain.assignmentHistory as unknown as Record<string, unknown>[],
        };
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
