import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { rowsToCsv } from '@/shared/infrastructure/utils/json-to-csv.util';

export interface ExportInternalUsersInput {
  format?: string;
}

/** Cùng format file mẫu import: department (code thường), position (level), isActive TRUE/FALSE */
export interface ExportInternalUserCsvRow {
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  position: string;
  isActive: string;
}

const CSV_FIELDS = [
  'name',
  'email',
  'employeeCode',
  'department',
  'position',
  'isActive',
] as const;

@Injectable()
export class ExportInternalUsersUseCase implements IUseCase<ExportInternalUsersInput, string> {
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(_input: ExportInternalUsersInput): Promise<string> {
    const [users, departments, positions] = await Promise.all([
      this.internalUserRepository.findForExport(),
      this.departmentRepository.findAll(),
      this.positionRepository.findAll(),
    ]);

    const departmentById = new Map(
      departments.map((department) => [department.id, department]),
    );
    const positionById = new Map(positions.map((position) => [position.id, position]));

    const rows: ExportInternalUserCsvRow[] = users.map((user) => {
      const department = departmentById.get(user.departmentId);
      const position = positionById.get(user.positionId);

      return {
        name: user.name,
        email: user.email,
        employeeCode: user.employeeCode,
        department: (department?.code ?? '').toLowerCase(),
        position:
          position?.level !== undefined && position?.level !== null
            ? String(position.level)
            : '',
        isActive: user.isActive ? 'TRUE' : 'FALSE',
      };
    });

    return rowsToCsv(
      rows as unknown as Record<string, unknown>[],
      [...CSV_FIELDS],
    );
  }
}
