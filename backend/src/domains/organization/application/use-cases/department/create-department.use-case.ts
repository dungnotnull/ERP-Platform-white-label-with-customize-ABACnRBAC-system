import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateDepartmentInput, DepartmentOutput } from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { DuplicateDepartmentCodeException } from '@/domains/organization/domain/exceptions/duplicate-department-code.exception';
import {
  normalizeAndValidateOrganizationNameJa,
  normalizeAndValidateOrganizationNameVi,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { toDepartmentOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

@Injectable()
export class CreateDepartmentUseCase implements IUseCase<CreateDepartmentInput, DepartmentOutput> {
  constructor(
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(input: CreateDepartmentInput): Promise<DepartmentOutput> {
    const code = input.code.toUpperCase();
    const nameVi = normalizeAndValidateOrganizationNameVi(input.nameVi, true);
    const nameJa = normalizeAndValidateOrganizationNameJa(input.nameJa);

    const existingActive = await this.departmentRepository.findActiveByCode(code);
    if (existingActive) {
      throw new DuplicateDepartmentCodeException(code);
    }

    const softDeleted = await this.departmentRepository.findByCode(code, {
      includeDeleted: true,
    });
    if (softDeleted?.isDeleted) {
      softDeleted.update({
        nameVi,
        nameJa,
        description: input.description ?? '',
        isDeleted: false,
      });
      const restored = await this.departmentRepository.save(softDeleted);
      return toDepartmentOutput(restored);
    }

    const department = new DepartmentEntity('', {
      code,
      nameVi,
      nameJa,
      description: input.description ?? '',
      isDeleted: false,
    });

    const saved = await this.departmentRepository.save(department);
    return toDepartmentOutput(saved);
  }
}
