import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserQueryPort } from '../../ports/services/internal-user-query.port';
import { DepartmentQueryPort } from '../../ports/services/department-query.port';

export interface GetBookingInternalUsersInput {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface BookingParticipantDepartmentOutput {
  nameVi: string;
  nameJa: string;
}

export interface BookingParticipantOutput {
  id: string;
  name: string;
  department: BookingParticipantDepartmentOutput | null;
}

export interface PaginatedBookingParticipantsOutput {
  items: BookingParticipantOutput[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

const DEFAULT_PAGE_SIZE = 30;

@Injectable()
export class GetBookingInternalUsersUseCase
  implements IUseCase<GetBookingInternalUsersInput, PaginatedBookingParticipantsOutput>
{
  constructor(
    @Inject('InternalUserQueryPort')
    private readonly internalUserQueryPort: InternalUserQueryPort,
    @Inject('DepartmentQueryPort')
    private readonly departmentQueryPort: DepartmentQueryPort,
  ) {}

  async execute(input: GetBookingInternalUsersInput): Promise<PaginatedBookingParticipantsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? DEFAULT_PAGE_SIZE;

    const result = await this.internalUserQueryPort.findActivePaginated({
      search: input.search,
      departmentId: input.departmentId,
      page,
      limit,
    });

    const departmentIds = [
      ...new Set(
        result.items
          .map((user) => user.departmentId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const departments = await this.departmentQueryPort.findByIds(departmentIds);
    const departmentMap = new Map(departments.map((department) => [department.id, department]));

    const items: BookingParticipantOutput[] = result.items.map((user) => {
      const department = departmentMap.get(user.departmentId);

      return {
        id: user.id,
        name: user.name,
        department: department
          ? {
              nameVi: department.nameVi,
              nameJa: department.nameJa,
            }
          : null,
      };
    });

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pageCount: result.pageCount,
    };
  }
}
