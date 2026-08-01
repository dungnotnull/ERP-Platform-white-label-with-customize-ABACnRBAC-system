import { Inject, Injectable } from '@nestjs/common';
import { DeviceRepositoryPort } from '@/domains/asset/application/ports/repositories/device.repository.port';
import { AssignmentQueryPort, DeviceSummaryResult } from '@/domains/organization/application/ports/services/assignment-query.port';

@Injectable()
export class AssignmentQueryAdapter implements AssignmentQueryPort {
  constructor(
    @Inject('DeviceRepositoryPort') private readonly deviceRepository: DeviceRepositoryPort,
  ) {}

  async getDeviceSummaryByDepartment(departmentId: string): Promise<DeviceSummaryResult> {
    const rows = await this.deviceRepository.aggregateAssignedDevicesByDepartment();
    const total = rows
      .filter((row) => row.departmentId === departmentId)
      .reduce((sum, row) => sum + row.count, 0);

    return { total, activeAssignments: total };
  }

  async getDeviceSummaryByUser(userId: string): Promise<DeviceSummaryResult> {
    const summaries = await this.getDeviceSummariesByUserIds([userId]);
    return (
      summaries.get(userId) ?? {
        total: 0,
        activeAssignments: 0,
      }
    );
  }

  async getDeviceSummariesByUserIds(
    userIds: string[],
  ): Promise<Map<string, DeviceSummaryResult>> {
    const result = new Map<string, DeviceSummaryResult>();
    if (userIds.length === 0) {
      return result;
    }

    const uniqueIds = [...new Set(userIds.map((id) => String(id)))];
    const rows =
      await this.deviceRepository.aggregateActiveAssignmentsByUserIds(uniqueIds);

    const countByUserId = new Map<string, number>();
    for (const row of rows) {
      countByUserId.set(row.userId, row.count);
    }

    for (const userId of uniqueIds) {
      const activeAssignments = countByUserId.get(userId) ?? 0;
      result.set(userId, {
        total: activeAssignments,
        activeAssignments,
      });
    }

    return result;
  }

  async getAllActiveAssignmentCounts(): Promise<Map<string, number>> {
    const rows =
      await this.deviceRepository.aggregateActiveAssignmentsByUserIds();
    return new Map(rows.map((row) => [row.userId, row.count]));
  }
}
