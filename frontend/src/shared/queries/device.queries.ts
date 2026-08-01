import { queryOptions, useQuery } from "@tanstack/react-query";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";
import { queryKeys } from "./keys";
import type { DeviceStatus, DeviceType } from "@/shared/@types/assets.type";

export const deviceTypesQueryOptions = queryOptions({
  queryKey: queryKeys.deviceTypes,
  queryFn: async () => {
    const payload = await apiClient.get(apiRoutes[ApiRouteNames.DEVICE_TYPES]);
    return extractApiList<DeviceType>(payload);
  },
  staleTime: 5 * 60_000
});

export const deviceStatusesQueryOptions = queryOptions({
  queryKey: queryKeys.deviceStatuses,
  queryFn: async () => {
    const payload = await apiClient.get(
      apiRoutes[ApiRouteNames.DEVICE_STATUSES]
    );
    return extractApiList<DeviceStatus>(payload);
  },
  staleTime: 5 * 60_000
});

export function useDeviceTypesQuery() {
  return useQuery(deviceTypesQueryOptions);
}

export function useDeviceStatusesQuery() {
  return useQuery(deviceStatusesQueryOptions);
}
