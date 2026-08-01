import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import {
  DepartmentOverviewEmployeeOutput,
  DepartmentOverviewOutput,
  DepartmentsOverviewOutput,
} from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';

@Injectable()
export class GetDepartmentsOverviewUseCase
  implements IUseCase<void, DepartmentsOverviewOutput>
{
  constructor(
    @Inject('DepartmentRepositoryPort')
    private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('InternalUserRepositoryPort')
    private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('PositionRepositoryPort')
    private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(): Promise<DepartmentsOverviewOutput> {
    const [departments, employees, positions] = await Promise.all([
      this.departmentRepository.findAllForOverview(),
      this.internalUserRepository.findAllForDepartmentOverview(),
      this.positionRepository.findAll(),
    ]);

    const positionMap = new Map(
      positions.map((p) => [
        p.id,
        { id: p.id, nameVi: p.nameVi, nameJa: p.nameJa, level: p.level },
      ]),
    );

    const employeesByDepartment = new Map<string, DepartmentOverviewEmployeeOutput[]>();

    for (const user of employees) {
      const deptKey = user.departmentId || '';
      const position = user.positionId
        ? positionMap.get(user.positionId) ?? null
        : null;

      const row: DepartmentOverviewEmployeeOutput = {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeCode: user.employeeCode,
        departmentId: user.departmentId,
        positionId: user.positionId,
        position,
        isActive: user.isActive,
        role: user.role,
      };

      const list = employeesByDepartment.get(deptKey) ?? [];
      list.push(row);
      employeesByDepartment.set(deptKey, list);
    }

    const items: DepartmentOverviewOutput[] = departments.map((department) => {
      const deptEmployees = employeesByDepartment.get(department.id) ?? [];
      return {
        id: department.id,
        code: department.code,
        nameVi: department.nameVi,
        nameJa: department.nameJa,
        description: department.description,
        employeeCount: deptEmployees.length,
        employees: deptEmployees,
      };
    });

    return {
      items,
      total: items.length,
    };
  }
}
