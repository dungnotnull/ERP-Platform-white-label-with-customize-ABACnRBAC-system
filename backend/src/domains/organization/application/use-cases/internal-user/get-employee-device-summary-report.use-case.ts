import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { DeviceTypeRepositoryPort } from '@/domains/asset/application/ports/repositories/device-type.repository.port';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';

export interface GetEmployeeDeviceSummaryReportInput {
  page?: number;
  limit?: number;
}

export interface EmployeeDeviceSummaryRow {
  userName: string;
  groupNameVi: string;
  groupNameJa: string;
  deviceType: string;
  deviceName: string;
  totalDevices: number;
  latestAssignedAt?: Date;
}

export interface GetEmployeeDeviceSummaryReportOutput {
  items: EmployeeDeviceSummaryRow[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetEmployeeDeviceSummaryReportUseCase
  implements IUseCase<GetEmployeeDeviceSummaryReportInput, GetEmployeeDeviceSummaryReportOutput>
{
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
    @Inject('DeviceTypeRepositoryPort') private readonly deviceTypeRepository: DeviceTypeRepositoryPort,
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(
    input: GetEmployeeDeviceSummaryReportInput,
  ): Promise<GetEmployeeDeviceSummaryReportOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 50;

    // const result = await this.deviceRepository.findPaginated({ isDeleted: false }, 1, 10000);
    const devices = await this.deviceRepository.findAll({
      isDeleted: false,
    });

    const typeCache = new Map<string, string>();
    const userCache = new Map<string, { name: string; departmentId: string }>();
    const departmentCache = new Map<string, { nameVi: string; nameJa: string }>();

    // const items: EmployeeDeviceSummaryRow[] = [];
    const filteredItems: EmployeeDeviceSummaryRow[] = [];
    for (const device of devices) {
      const assignment = device.currentAssignment;
      if (!assignment?.userId) {
        continue;
      }

      let userInfo = userCache.get(assignment.userId);
      if (!userInfo) {
        const user = await this.internalUserRepository.findById(assignment.userId);
        if (!user) {
          continue;
        }
        userInfo = { name: user.name, departmentId: user.departmentId };
        userCache.set(assignment.userId, userInfo);
      }

      let departmentInfo = departmentCache.get(userInfo.departmentId);
      if (!departmentInfo) {
        const department = await this.departmentRepository.findById(userInfo.departmentId);
        departmentInfo = {
          nameVi: department?.nameVi ?? '',
          nameJa: department?.nameJa ?? '',
        };
        departmentCache.set(userInfo.departmentId, departmentInfo);
      }

      let deviceTypeName = typeCache.get(device.deviceTypeId);
      if (!deviceTypeName) {
        const deviceType = await this.deviceTypeRepository.findById(device.deviceTypeId);
        deviceTypeName = deviceType?.name ?? '';
        typeCache.set(device.deviceTypeId, deviceTypeName);
      }

      filteredItems.push({
        userName: assignment.userName || userInfo.name,
        groupNameVi: departmentInfo.nameVi,
        groupNameJa: departmentInfo.nameJa,
        deviceType: deviceTypeName,
        deviceName: device.name,
        totalDevices: 1,
        latestAssignedAt: assignment.assignedAt,
      });
    }

    const total = filteredItems.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = filteredItems.slice(start, end);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
    };
  }
}
