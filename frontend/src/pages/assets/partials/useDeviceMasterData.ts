import { useQuery } from "@tanstack/react-query";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";

export function useDeviceMasterData() {
  return useQuery({
    queryKey: ["device-master-data"],

    queryFn: async () => {
      const [types, statuses] = await Promise.all([
        apiClient.get(apiRoutes[ApiRouteNames.DEVICE_TYPES]),
        apiClient.get(apiRoutes[ApiRouteNames.DEVICE_STATUSES])
      ]);

      return {
        deviceTypes: extractApiList(types),
        statuses: extractApiList(statuses)
      };
    },

    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60
  });
}
