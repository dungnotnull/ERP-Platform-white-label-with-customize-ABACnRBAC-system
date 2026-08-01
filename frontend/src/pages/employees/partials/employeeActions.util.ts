import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";

export async function softDeleteInternalUser(id: string): Promise<void> {
  await apiClient.delete(`${apiRoutes[ApiRouteNames.INTERNAL_USERS]}/${id}`);
}
