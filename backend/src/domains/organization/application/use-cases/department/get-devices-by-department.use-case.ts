import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import {
  DepartmentDeviceTypeStatOutput,
  DepartmentDevicesStatOutput,
  DevicesByDepartmentOutput,
} from '@/domains/organization/application/dtos/department.dtos';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';

@Injectable()
export class GetDevicesByDepartmentUseCase
  implements IUseCase<void, DevicesByDepartmentOutput>
{
  constructor(
    @Inject('DepartmentRepositoryPort')
    private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('DeviceRepositoryPort')
    private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async execute(): Promise<DevicesByDepartmentOutput> {
    const [departments, aggregateRows] = await Promise.all([
      this.departmentRepository.findAll(),
      this.deviceRepository.aggregateAssignedDevicesByDepartment(),
    ]);

    const statsByDepartment = new Map<string, DepartmentDeviceTypeStatOutput[]>();

    for (const row of aggregateRows) {
      if (!row.departmentId) continue;

      const deviceTypes = statsByDepartment.get(row.departmentId) ?? [];
      const existing = deviceTypes.find(
        (item) => item.deviceTypeName === row.deviceTypeName,
      );

      if (existing) {
        existing.totalAssignedDevices += row.count;
      } else {
        deviceTypes.push({
          deviceTypeName: row.deviceTypeName,
          totalAssignedDevices: row.count,
        });
      }

      statsByDepartment.set(row.departmentId, deviceTypes);
    }

    const items: DepartmentDevicesStatOutput[] = departments.map((department) => {
      const deviceTypes = statsByDepartment.get(department.id) ?? [];
      const total = deviceTypes.reduce(
        (sum, item) => sum + item.totalAssignedDevices,
        0,
      );

      return {
        departmentId: department.id,
        nameVi: department.nameVi,
        nameJa: department.nameJa,
        total,
        deviceTypes: deviceTypes.sort((a, b) =>
          a.deviceTypeName.localeCompare(b.deviceTypeName),
        ),
      };
    });

    return { items };
  }
}
