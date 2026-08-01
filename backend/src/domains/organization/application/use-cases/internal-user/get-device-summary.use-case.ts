import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceSummaryOutput } from '@/domains/organization/application/dtos/internal-user.dtos';
import { AssignmentQueryPort } from '@/domains/organization/application/ports/services/assignment-query.port';

export interface GetDeviceSummaryInput {
  userId: string;
}

@Injectable()
export class GetDeviceSummaryUseCase implements IUseCase<GetDeviceSummaryInput, DeviceSummaryOutput> {
  constructor(
    @Inject('AssignmentQueryPort') private readonly assignmentQueryPort: AssignmentQueryPort,
  ) {}

  async execute(input: GetDeviceSummaryInput): Promise<DeviceSummaryOutput> {
    const summary = await this.assignmentQueryPort.getDeviceSummaryByUser(input.userId);

    return {
      total: summary.total,
      activeAssignments: summary.activeAssignments,
    };
  }
}
