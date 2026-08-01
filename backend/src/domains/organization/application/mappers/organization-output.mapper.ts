import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';
import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';
import { DepartmentOutput } from '@/domains/organization/application/dtos/department.dtos';
import { PositionOutput } from '@/domains/organization/application/dtos/position.dtos';

export function toDepartmentOutput(department: DepartmentEntity): DepartmentOutput {
  return {
    id: department.id,
    code: department.code,
    nameVi: department.nameVi,
    nameJa: department.nameJa,
    description: department.description,
  };
}

export function toPositionOutput(position: PositionEntity): PositionOutput {
  return {
    id: position.id,
    nameVi: position.nameVi,
    nameJa: position.nameJa,
    level: position.level,
  };
}
