import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserOutput } from '@/domains/organization/application/dtos/internal-user.dtos';
import { DeviceOutput } from '@/domains/asset/application/dtos/device.dtos';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { InternalUserNotFoundException } from '@/domains/organization/domain/exceptions/internal-user-not-found.exception';

const ASSIGNED_DEVICES_LIMIT = 100;

export interface GetInternalUserInput {
  id: string;
}

@Injectable()
export class GetInternalUserUseCase implements IUseCase<GetInternalUserInput, InternalUserOutput> {
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(input: GetInternalUserInput): Promise<InternalUserOutput> {
    const user = await this.internalUserRepository.findById(input.id);
    if (!user) {
      throw new InternalUserNotFoundException(input.id);
    }

    const [department, position, devicesResult] = await Promise.all([
      this.departmentRepository.findById(user.departmentId),
      this.positionRepository.findById(user.positionId),
      this.deviceRepository.findPaginated(
        { assignedUserId: input.id },
        1,
        ASSIGNED_DEVICES_LIMIT,
      ),
    ]);

    const assignedDevices = devicesResult.items.map(
      (device) => device.toPlainObject() as unknown as DeviceOutput,
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeCode: user.employeeCode,
      departmentId: user.departmentId,
      positionId: user.positionId,
      department: department
        ? {
            id: department.id,
            code: department.code,
            nameVi: department.nameVi,
            nameJa: department.nameJa,
          }
        : null,
      position: position
        ? {
            id: position.id,
            nameVi: position.nameVi,
            nameJa: position.nameJa,
            level: position.level,
          }
        : null,
      isActive: user.isActive,
      role: user.role,
      deviceSummary: user.deviceSummary,
      assignedDevices,
    };
  }
}
