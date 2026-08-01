import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DepartmentOutput, PaginatedDepartmentsOutput } from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { toDepartmentOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

export interface GetDepartmentsInput {
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetDepartmentsUseCase implements IUseCase<GetDepartmentsInput, PaginatedDepartmentsOutput> {
  constructor(
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
  ) { }

  async execute(input: GetDepartmentsInput): Promise<PaginatedDepartmentsOutput> {
    const departments = await this.departmentRepository.findAll(input.search);

    const page = input.page ?? 1;
    const limit = input.limit ?? (departments.length || 10);
    const start = (page - 1) * limit;
    const paginatedItems = departments.slice(start, start + limit);

    const items: DepartmentOutput[] = paginatedItems.map((d) => toDepartmentOutput(d));

    return {
      items,
      total: departments.length,
      page,
      limit,
    };
  }
}
