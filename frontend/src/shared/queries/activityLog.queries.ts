import { useQuery } from "@tanstack/react-query";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { queryKeys } from "./keys";

export interface ActivityLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isSuperadmin: boolean | null;
  action: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestBody: Record<string, unknown> | null;
  responseTimeMs: number;
  timestamp: string;
}

export interface ActivityLogResponse {
  items: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  method?: string;
  statusCode?: number;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
}

export function useActivityLogsQuery(
  filters: ActivityLogFilters,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.activityLogs(filters as Record<string, unknown>),
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.action) params.action = filters.action;
      if (filters.method) params.method = filters.method;
      if (filters.statusCode) params.statusCode = filters.statusCode;
      if (filters.userEmail?.trim())
        params.userEmail = filters.userEmail.trim();
      if (filters.startDate)
        params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate)
        params.endDate = new Date(filters.endDate).toISOString();

      return apiClient.get<ActivityLogResponse>(
        apiRoutes[ApiRouteNames.ACTIVITY_LOGS] ?? "/activity-logs",
        { params }
      );
    },
    staleTime: 30_000,
    enabled
  });
}
