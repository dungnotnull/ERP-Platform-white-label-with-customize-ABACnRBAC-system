import { apiClient } from "@/services/api/apiClient.service.ts";
import {
  ApiRouteNames,
  apiRoutes
} from "@/shared/constants/routes.constant.ts";
import { AbacPolicy } from "@/shared/@types/abac.type.ts";

export const abacService = {
  async getPolicies(): Promise<AbacPolicy[]> {
    const url = apiRoutes[ApiRouteNames.ABAC_POLICIES];
    const data = await apiClient.get<AbacPolicy[]>(url);
    return Array.isArray(data) ? data : [];
  }
};
