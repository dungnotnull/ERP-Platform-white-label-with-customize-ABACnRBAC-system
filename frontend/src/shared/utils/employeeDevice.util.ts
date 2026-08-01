import type { Device } from "@/shared/@types/assets.type";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";

export interface EmployeeDetail {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  department?: {
    id: string;
    code: string;
    nameVi: string;
    nameJa: string;
  } | null;
  position?: {
    id: string;
    nameVi: string;
    nameJa: string;
    level?: number | null;
  } | null;
  isActive: boolean;
  assignedDevices?: Device[];
}

export async function fetchEmployeeDetail(
  employeeId: string
): Promise<EmployeeDetail> {
  return apiClient.get(
    `${apiRoutes[ApiRouteNames.INTERNAL_USERS]}/${employeeId}`
  );
}
