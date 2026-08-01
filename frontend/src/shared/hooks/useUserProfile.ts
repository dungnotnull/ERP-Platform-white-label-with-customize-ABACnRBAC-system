import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/api/apiAuth.service";
import TokenService from "@/services/token.service.ts";
import { User } from "@/shared/@types/user.type.ts";
import { queryKeys } from "@/shared/queries/keys";

export function useUserProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<User | null>({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const token = TokenService.getAccessToken();
      if (!token) return null;
      try {
        const profile = await authApi.getUserProfile();
        if (!profile?._id) throw new Error("Invalid user profile response");
        return profile;
      } catch (error) {
        const status =
          typeof error === "object" && error !== null && "status" in error
            ? (error as { status: number }).status
            : null;
        if (status === 401) throw error;
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!TokenService.getAccessToken(),
    retry: 1
  });

  const user = query.data ?? null;
  const isAuthenticated = !!user;

  const getRoleId = useCallback((): string | null => {
    if (user?.roleIds?.length) return user.roleIds[0];
    if (typeof user?.roleId === "string") return user.roleId;
    if (
      user?.roleId &&
      typeof user.roleId === "object" &&
      "id" in user.roleId
    ) {
      return (user.roleId as { id?: string }).id ?? null;
    }
    return null;
  }, [user]);

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!user) return false;
      const roleStr = (user as { role?: string }).role;
      const roleFromId =
        user.roleId && typeof user.roleId === "object" && "name" in user.roleId
          ? (user.roleId as { name: string }).name
          : undefined;
      const userRoles = [
        ...(roleStr ? [roleStr] : []),
        ...(roleFromId ? [roleFromId] : []),
        ...(Array.isArray(user.roles) ? user.roles : [])
      ].filter(Boolean);

      if (Array.isArray(role)) {
        return role.some(r => userRoles.includes(r) || roleStr === r);
      }
      return userRoles.includes(role) || roleStr === role;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string | string[]): boolean => {
      if (!user) return false;
      if (Array.isArray(permission)) {
        return permission.some(p => hasPermission(p));
      }

      const tokenPermissions = TokenService.getTokenPermissions(
        TokenService.getAccessToken()
      );
      if (tokenPermissions.includes(permission)) return true;

      const perms = user.permissions ?? [];
      return perms.some(p =>
        typeof p === "string" ? p === permission : p?.name === permission
      );
    },
    [user]
  );

  const setUserLocal = useCallback(
    (userData: Partial<User>) => {
      queryClient.setQueryData<User | null>(queryKeys.profile, prev => {
        if (!prev) return null;
        return { ...prev, ...userData };
      });
    },
    [queryClient]
  );

  return {
    user,
    isAuthenticated,
    isLoading: query.isLoading,
    hasPermission,
    hasRole,
    getRoleId,
    refetch: query.refetch,
    setUserLocal
  };
}
