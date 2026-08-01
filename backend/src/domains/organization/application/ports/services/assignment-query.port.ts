export interface DeviceSummaryResult {
  total: number;
  activeAssignments: number;
}

export interface AssignmentQueryPort {
  getDeviceSummaryByDepartment(departmentId: string): Promise<DeviceSummaryResult>;
  getDeviceSummaryByUser(userId: string): Promise<DeviceSummaryResult>;
  getDeviceSummariesByUserIds(
    userIds: string[],
  ): Promise<Map<string, DeviceSummaryResult>>;
  getAllActiveAssignmentCounts(): Promise<Map<string, number>>;
}
