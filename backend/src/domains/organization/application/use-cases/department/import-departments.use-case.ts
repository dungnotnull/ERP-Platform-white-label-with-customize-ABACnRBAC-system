import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DepartmentOutput } from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import {
  normalizeAndValidateOrganizationNameJa,
  normalizeAndValidateOrganizationNameVi,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { toDepartmentOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

export interface ImportDepartmentRow {
  code: string;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  description?: string;
}

export interface ImportDepartmentsInput {
  data: ImportDepartmentRow[];
}

@Injectable()
export class ImportDepartmentsUseCase implements IUseCase<ImportDepartmentsInput, DepartmentOutput[]> {
  constructor(
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(input: ImportDepartmentsInput): Promise<DepartmentOutput[]> {
    const results: DepartmentOutput[] = [];

    for (const row of input.data) {
      const upperCode = row.code.toUpperCase();
      const nameVi = normalizeAndValidateOrganizationNameVi(
        row.nameVi ?? row.name,
        true,
      );
      const nameJa = normalizeAndValidateOrganizationNameJa(row.nameJa);

      const active = await this.departmentRepository.findActiveByCode(upperCode);
      if (active) {
        active.update({
          nameVi,
          nameJa,
          description: row.description,
        });
        const saved = await this.departmentRepository.save(active);
        results.push(toDepartmentOutput(saved));
        continue;
      }

      const softDeleted = await this.departmentRepository.findByCode(upperCode, {
        includeDeleted: true,
      });
      if (softDeleted?.isDeleted) {
        softDeleted.update({
          nameVi,
          nameJa,
          description: row.description ?? '',
          isDeleted: false,
        });
        const restored = await this.departmentRepository.save(softDeleted);
        results.push(toDepartmentOutput(restored));
        continue;
      }

      const department = new DepartmentEntity('', {
        code: upperCode,
        nameVi,
        nameJa,
        description: row.description ?? '',
        isDeleted: false,
      });
      const saved = await this.departmentRepository.save(department);
      results.push(toDepartmentOutput(saved));
    }

    return results;
  }
}
