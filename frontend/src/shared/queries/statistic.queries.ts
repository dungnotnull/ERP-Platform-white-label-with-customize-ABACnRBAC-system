import { queryOptions, useQuery } from "@tanstack/react-query";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";
import { queryKeys } from "./keys";

export interface DepartmentDeviceTypeStat {
  deviceTypeName: string;
  totalAssignedDevices: number;
}

export interface DepartmentDevicesStat {
  departmentId: string;
  nameVi: string;
  nameJa: string;
  total: number;
  deviceTypes: DepartmentDeviceTypeStat[];
}

export interface DeviceStatistics {
  totalDevices: number;
  activeDevices: number;
  assignedDevices: number;
  availableDevices: number;
  devicesByType: Record<string, number>;
  devicesByStatus: Record<string, number>;
}

export const devicesByDepartmentQueryOptions = queryOptions({
  queryKey: queryKeys.devicesByDepartment,
  queryFn: async () => {
    const data = await apiClient.get(
      apiRoutes[ApiRouteNames.GET_DEVICES_BY_DEPARTMENT]
    );
    return extractApiList<DepartmentDevicesStat>(data);
  },
  staleTime: 30_000
});

export const deviceStatisticsQueryOptions = queryOptions({
  queryKey: queryKeys.deviceStatistics,
  queryFn: async () => {
    return apiClient.get<DeviceStatistics>(
      apiRoutes[ApiRouteNames.DEVICE_STATISTICS]
    );
  },
  staleTime: 30_000
});

export function useDevicesByDepartmentQuery() {
  return useQuery(devicesByDepartmentQueryOptions);
}

export function useDeviceStatisticsQuery() {
  return useQuery(deviceStatisticsQueryOptions);
}
