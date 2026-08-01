import { Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PaginatedDepartmentsOutput } from '@/domains/organization/application/dtos/department.dtos';
import { GetDepartmentsUseCase } from '@/domains/organization/application/use-cases/department/get-departments.use-case';

export interface GetBookingDepartmentsInput {
  search?: string;
  limit?: number;
}

@Injectable()
export class GetBookingDepartmentsUseCase
  implements IUseCase<GetBookingDepartmentsInput, PaginatedDepartmentsOutput>
{
  constructor(private readonly getDepartmentsUseCase: GetDepartmentsUseCase) {}

  async execute(input: GetBookingDepartmentsInput): Promise<PaginatedDepartmentsOutput> {
    const limit = input.limit ?? 1000;

    return this.getDepartmentsUseCase.execute({
      search: input.search,
      page: 1,
      limit,
    });
  }
}
