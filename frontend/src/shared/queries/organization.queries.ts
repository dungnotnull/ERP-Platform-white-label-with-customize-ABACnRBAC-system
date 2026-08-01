import { queryOptions, useQuery } from "@tanstack/react-query";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";
import { queryKeys } from "./keys";

export const positionsQueryOptions = queryOptions({
  queryKey: queryKeys.positions,
  queryFn: async () => {
    const payload = await apiClient.get(apiRoutes[ApiRouteNames.POSITIONS]);
    return extractApiList<{ id: string; nameVi: string; nameJa: string }>(
      payload
    );
  },
  staleTime: 5 * 60_000
});

export const departmentsListQueryOptions = (limit = 1000) =>
  queryOptions({
    queryKey: queryKeys.departments(limit),
    queryFn: async () => {
      const payload = await apiClient.get(
        apiRoutes[ApiRouteNames.DEPARTMENTS],
        {
          params: { limit }
        }
      );
      return extractApiList<{
        id: string;
        nameVi: string;
        nameJa: string;
        code?: string;
        description?: string;
      }>(payload);
    },
    staleTime: 5 * 60_000
  });

export function usePositionsQuery() {
  return useQuery(positionsQueryOptions);
}

export function useDepartmentsListQuery(limit = 1000) {
  return useQuery(departmentsListQueryOptions(limit));
}
