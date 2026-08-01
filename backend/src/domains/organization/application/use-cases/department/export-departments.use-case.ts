import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DepartmentOutput } from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { toDepartmentOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

export interface ExportDepartmentsInput {
  format?: string;
}

@Injectable()
export class ExportDepartmentsUseCase implements IUseCase<ExportDepartmentsInput, DepartmentOutput[]> {
  constructor(
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(_input: ExportDepartmentsInput): Promise<DepartmentOutput[]> {
    const departments = await this.departmentRepository.findForExport();
    return departments.map((d) => toDepartmentOutput(d));
  }
}
