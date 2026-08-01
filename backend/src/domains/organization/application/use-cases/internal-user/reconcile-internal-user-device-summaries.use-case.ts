import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { AssignmentQueryPort } from '@/domains/organization/application/ports/services/assignment-query.port';

export interface ReconcileInternalUserDeviceSummariesOutput {
  usersUpdated: number;
  usersWithDevices: number;
}

@Injectable()
export class ReconcileInternalUserDeviceSummariesUseCase
  implements IUseCase<void, ReconcileInternalUserDeviceSummariesOutput>
{
  constructor(
    @Inject('InternalUserRepositoryPort')
    private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('AssignmentQueryPort')
    private readonly assignmentQueryPort: AssignmentQueryPort,
  ) {}

  async execute(): Promise<ReconcileInternalUserDeviceSummariesOutput> {
    const countMap = await this.assignmentQueryPort.getAllActiveAssignmentCounts();
    const usersWithDevices = countMap.size;

    const allUsers = await this.internalUserRepository.findForExport();

    const updates = allUsers.map((user) => {
      const activeAssignments = countMap.get(user.id) ?? 0;
      return {
        userId: user.id,
        total: activeAssignments,
        activeAssignments,
      };
    });

    await this.internalUserRepository.bulkUpdateDeviceSummaries(updates);

    return {
      usersUpdated: updates.length,
      usersWithDevices,
    };
  }
}
