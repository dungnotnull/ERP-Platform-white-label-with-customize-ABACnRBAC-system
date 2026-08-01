import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateInternalUserInput, InternalUserOutput } from '@/domains/organization/application/dtos/internal-user.dtos';
import { InternalUserEntity } from '@/domains/organization/domain/entities/internal-user.entity';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { DepartmentNotFoundException } from '@/domains/organization/domain/exceptions/department-not-found.exception';
import { PositionNotFoundException } from '@/domains/organization/domain/exceptions/position-not-found.exception';
import { normalizeAndValidateEmployeeName } from '@/domains/organization/domain/validators/internal-user-name.validator';
import { InternalUserUniquenessService } from '@/domains/organization/application/services/internal-user-uniqueness.service';

@Injectable()
export class CreateInternalUserUseCase implements IUseCase<CreateInternalUserInput, InternalUserOutput> {
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
    private readonly uniquenessService: InternalUserUniquenessService,
  ) {}

  async execute(input: CreateInternalUserInput): Promise<InternalUserOutput> {
    const department = await this.departmentRepository.findById(input.departmentId);
    if (!department) {
      throw new DepartmentNotFoundException(input.departmentId);
    }

    const position = await this.positionRepository.findById(input.positionId);
    if (!position) {
      throw new PositionNotFoundException(input.positionId);
    }

    const email = input.email.trim().toLowerCase();
    const employeeCode = input.employeeCode.trim().toUpperCase();

    await this.uniquenessService.assertActiveEmailAvailable(email);

    const softDeletedByEmail = await this.internalUserRepository.findByEmail(email, {
      includeDeleted: true,
    });
    if (softDeletedByEmail?.isDeleted) {
      await this.uniquenessService.assertActiveEmployeeCodeAvailable(
        employeeCode,
        softDeletedByEmail.id,
      );

      softDeletedByEmail.update({
        name: normalizeAndValidateEmployeeName(input.name, true),
        email,
        employeeCode,
        departmentId: input.departmentId,
        positionId: input.positionId,
        isActive: input.isActive ?? true,
        isDeleted: false,
        role: input.role ?? softDeletedByEmail.role,
      });

      const restored = await this.internalUserRepository.save(softDeletedByEmail);
      return {
        id: restored.id,
        name: restored.name,
        email: restored.email,
        employeeCode: restored.employeeCode,
        departmentId: restored.departmentId,
        positionId: restored.positionId,
        isActive: restored.isActive,
        role: restored.role,
        deviceSummary: restored.deviceSummary,
      };
    }

    await this.uniquenessService.assertActiveEmployeeCodeAvailable(employeeCode);

    const user = new InternalUserEntity('', {
      name: normalizeAndValidateEmployeeName(input.name, true),
      email,
      employeeCode,
      departmentId: input.departmentId,
      positionId: input.positionId,
      isActive: input.isActive ?? true,
      isDeleted: false,
      role: input.role ?? '',
      deviceSummary: { total: 0, activeAssignments: 0 },
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
