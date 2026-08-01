import { Inject, Injectable } from '@nestjs/common';
import { InternalUserDeviceSummarySyncPort } from '@/domains/asset/application/ports/services/internal-user-device-summary-sync.port';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { AssignmentQueryPort } from '@/domains/organization/application/ports/services/assignment-query.port';

@Injectable()
export class InternalUserDeviceSummarySyncAdapter
  implements InternalUserDeviceSummarySyncPort
{
  constructor(
    @Inject('InternalUserRepositoryPort')
    private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('AssignmentQueryPort')
    private readonly assignmentQueryPort: AssignmentQueryPort,
  ) {}

  async refreshForUser(userId: string): Promise<void> {
    if (!userId) {
      return;
    }

    const user = await this.internalUserRepository.findById(userId);
    if (!user) {
      return;
    }

    const summary = await this.assignmentQueryPort.getDeviceSummaryByUser(userId);
    user.updateDeviceSummary({
      total: summary.total,
      activeAssignments: summary.activeAssignments,
    });
    await this.internalUserRepository.save(user);
  }
}
