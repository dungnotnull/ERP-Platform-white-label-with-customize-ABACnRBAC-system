import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { AssignmentQueryPort } from '@/domains/organization/application/ports/services/assignment-query.port';
import { InternalUserNotFoundException } from '@/domains/organization/domain/exceptions/internal-user-not-found.exception';
import { InternalUserHasAssignedDevicesException } from '@/domains/organization/domain/exceptions/internal-user-has-assigned-devices.exception';

export interface DeleteInternalUserInput {
  id: string;
}

export interface DeleteInternalUserOutput {
  deleted: boolean;
}

@Injectable()
export class DeleteInternalUserUseCase implements IUseCase<DeleteInternalUserInput, DeleteInternalUserOutput> {
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('AssignmentQueryPort') private readonly assignmentQueryPort: AssignmentQueryPort,
  ) {}

  async execute(input: DeleteInternalUserInput): Promise<DeleteInternalUserOutput> {
    const user = await this.internalUserRepository.findById(input.id);
    if (!user) {
      throw new InternalUserNotFoundException(input.id);
    }

    const deviceSummary = await this.assignmentQueryPort.getDeviceSummaryByUser(input.id);
    if (deviceSummary.activeAssignments > 0) {
      throw new InternalUserHasAssignedDevicesException(deviceSummary.activeAssignments);
    }

    user.softDelete();

    await this.internalUserRepository.save(user);

    return { deleted: true };
  }
}
