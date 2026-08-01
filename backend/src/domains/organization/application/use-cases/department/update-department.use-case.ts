import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateDepartmentInput, DepartmentOutput } from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { DepartmentNotFoundException } from '@/domains/organization/domain/exceptions/department-not-found.exception';
import {
  normalizeAndValidateOrganizationNameJa,
  normalizeAndValidateOrganizationNameVi,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { toDepartmentOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

@Injectable()
export class UpdateDepartmentUseCase implements IUseCase<UpdateDepartmentInput, DepartmentOutput> {
  constructor(
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
  ) { }

  async execute(input: UpdateDepartmentInput): Promise<DepartmentOutput> {
    const department = await this.departmentRepository.findById(input.id);
    if (!department) {
      throw new DepartmentNotFoundException(input.id);
    }

    department.update({
      nameVi:
        input.nameVi !== undefined
          ? normalizeAndValidateOrganizationNameVi(input.nameVi, true)
          : undefined,
      nameJa:
        input.nameJa !== undefined
          ? normalizeAndValidateOrganizationNameJa(input.nameJa)
          : undefined,
      description: input.description,
    });

    const saved = await this.departmentRepository.save(department);
    return toDepartmentOutput(saved);
  }
}
