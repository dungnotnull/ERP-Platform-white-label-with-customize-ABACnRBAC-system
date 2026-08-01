import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateInternalUserInput, InternalUserOutput } from '@/domains/organization/application/dtos/internal-user.dtos';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { InternalUserNotFoundException } from '@/domains/organization/domain/exceptions/internal-user-not-found.exception';
import { normalizeAndValidateEmployeeName } from '@/domains/organization/domain/validators/internal-user-name.validator';
import { InternalUserUniquenessService } from '@/domains/organization/application/services/internal-user-uniqueness.service';

@Injectable()
export class UpdateInternalUserUseCase implements IUseCase<UpdateInternalUserInput, InternalUserOutput> {
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    private readonly uniquenessService: InternalUserUniquenessService,
  ) {}

  async execute(input: UpdateInternalUserInput): Promise<InternalUserOutput> {
    const user = await this.internalUserRepository.findById(input.id);
    if (!user) {
      throw new InternalUserNotFoundException(input.id);
    }

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      await this.uniquenessService.assertActiveEmailAvailable(email, input.id);
    }

    if (input.employeeCode !== undefined) {
      const employeeCode = input.employeeCode.trim().toUpperCase();
      await this.uniquenessService.assertActiveEmployeeCodeAvailable(
        employeeCode,
        input.id,
      );
    }

    user.update({
      name:
        input.name !== undefined
          ? normalizeAndValidateEmployeeName(input.name, true)
          : undefined,
      email: input.email?.toLowerCase(),
      employeeCode: input.employeeCode?.trim().toUpperCase(),
      departmentId: input.departmentId,
      positionId: input.positionId,
      role: input.role,
      isActive: input.isActive,
    });

    const saved = await this.internalUserRepository.save(user);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      employeeCode: saved.employeeCode,
      departmentId: saved.departmentId,
      positionId: saved.positionId,
      isActive: saved.isActive,
      role: saved.role,
      deviceSummary: saved.deviceSummary,
    };
  }
}
