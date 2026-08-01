import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import {
  PaginatedInternalUsersOutput,
  InternalUserOutput,
  DepartmentRefOutput,
  PositionRefOutput,
} from '@/domains/organization/application/dtos/internal-user.dtos';
import { InternalUserRepositoryPort, InternalUserFilterInput } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
export interface GetInternalUsersInput {
  filter?: InternalUserFilterInput;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetInternalUsersUseCase implements IUseCase<GetInternalUsersInput, PaginatedInternalUsersOutput> {
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(input: GetInternalUsersInput): Promise<PaginatedInternalUsersOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const filter: InternalUserFilterInput = {
      search: input.filter?.search,
      departmentId: input.filter?.departmentId,
      positionId: input.filter?.positionId,
      isActive: input.filter?.isActive,
      sort: input.filter?.sort,
      order: input.filter?.order,
    };

    const result = await this.internalUserRepository.findPaginated(
      filter,
      page,
      limit,
    );

    const departmentIds = [
      ...new Set(
        result.items
          .map((user) => user.departmentId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const positionIds = [
      ...new Set(
        result.items
          .map((user) => user.positionId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [departments, positions] = await Promise.all([
      this.departmentRepository.findByIds(departmentIds),
      this.positionRepository.findByIds(positionIds),
    ]);

    const departmentMap = new Map<string, DepartmentRefOutput>(
      departments.map((d) => [
        d.id,
        { id: d.id, code: d.code, nameVi: d.nameVi, nameJa: d.nameJa },
      ]),
    );
    const positionMap = new Map<string, PositionRefOutput>(
      positions.map((p) => [
        p.id,
        { id: p.id, nameVi: p.nameVi, nameJa: p.nameJa, level: p.level },
      ]),
    );

    const items: InternalUserOutput[] = result.items.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      employeeCode: user.employeeCode,
      departmentId: user.departmentId,
      positionId: user.positionId,
      department: departmentMap.get(user.departmentId) ?? null,
      position: positionMap.get(user.positionId) ?? null,
      isActive: user.isActive,
      role: user.role,
      deviceSummary: user.deviceSummary,
    }));

    const pageCount =
      result.limit > 0 ? Math.max(1, Math.ceil(result.total / result.limit)) : 1;

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pageCount,
    };
  }
}
