import { queryOptions, useQuery } from "@tanstack/react-query";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { queryKeys } from "./keys";
import type {
  EndpointPermissionsResponse,
  RolesResponse,
  RoleOutput,
  ModuleOutput,
  DepartmentOutput
} from "@/shared/@types/permission.type";

export const modulesQueryOptions = queryOptions({
  queryKey: ["modules"],
  queryFn: async () => {
    const data = await apiClient.get<ModuleOutput[]>(
      apiRoutes[ApiRouteNames.MODULES] ?? "/modules"
    );
    return Array.isArray(data) ? data : [];
  },
  staleTime: 5 * 60_000
});

export const endpointPermissionsQueryOptions = queryOptions({
  queryKey: queryKeys.endpointPermissions,
  queryFn: async () => {
    const res = await apiClient.get<EndpointPermissionsResponse>(
      `${apiRoutes[ApiRouteNames.ENDPOINT_PERMISSIONS]}?limit=500`
    );
    return res?.items ?? [];
  },
  staleTime: 60_000
});

export const rolesQueryOptions = queryOptions({
  queryKey: queryKeys.roles,
  queryFn: async () => {
    const res = await apiClient.get<RolesResponse>(
      apiRoutes[ApiRouteNames.ROLES] ?? "/roles"
    );
    return res?.items ?? [];
  },
  staleTime: 60_000
});

export const permissionDepartmentsQueryOptions = queryOptions({
  queryKey: queryKeys.departments(100),
  queryFn: async () => {
    const res = await apiClient.get<{ items: DepartmentOutput[] }>(
      `${apiRoutes[ApiRouteNames.DEPARTMENTS]}?limit=100`
    );
    return res?.items ?? [];
  },
  staleTime: 5 * 60_000
});

export function useModulesQuery() {
  return useQuery(modulesQueryOptions);
}

export function useEndpointPermissionsQuery() {
  return useQuery(endpointPermissionsQueryOptions);
}

export function useRolesQuery() {
  return useQuery(rolesQueryOptions);
}

export function usePermissionDepartmentsQuery() {
  return useQuery(permissionDepartmentsQueryOptions);
}

const rolesApi = apiRoutes[ApiRouteNames.ROLES] ?? "/roles";

const rolesByDeptCache = new Map<string, RoleOutput[]>();

export async function fetchRolesByDepartments(
  departmentIds: string[]
): Promise<RoleOutput[]> {
  if (!departmentIds || departmentIds.length === 0) return [];

  const sortedIds = [...departmentIds].filter(Boolean).sort();
  const cacheKey = sortedIds.join(",");

  if (rolesByDeptCache.has(cacheKey)) {
    return rolesByDeptCache.get(cacheKey)!;
  }

  try {
    const params = new URLSearchParams();
    sortedIds.forEach(id => {
      params.append("departmentIds", id);
    });

    const url = `${rolesApi}/by-departments?${params.toString()}`;
    const res = await apiClient.get<any>(url);

    const result = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : [];

    rolesByDeptCache.set(cacheKey, result);
    return result;
  } catch (e) {
    console.error("Failed to fetch roles by departments:", e);
    return [];
  }
}
