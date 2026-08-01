import { Navigate } from "react-router-dom";
import { useUserProfile } from "@/shared/hooks/useUserProfile.ts";
import { useAuth } from "@/context/AuthContext";
import {
  AppRouteNames,
  appRoutes
} from "@/shared/constants/routes.constant.ts";
import { DEFAULT_VISIBLE_MENUS, ALL_VISIBLE_MENUS } from "@/shared/constants/menu.constants";
import type { VisibleMenuValue } from "@/shared/constants/menu.constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  requiredMenu?: VisibleMenuValue;
}

const ProtectedRoute = ({
  children,
  roles = [],
  permissions = [],
  requiredMenu
}: ProtectedRouteProps) => {
  const { isLoading: authLoading } = useAuth();
  const {
    user,
    isAuthenticated,
    isLoading: profileLoading,
    hasPermission
  } = useUserProfile();

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 z-[9999] h-[3px] w-full overflow-hidden bg-primary/10">
        <div
          className="
          h-full
          w-1/4
          bg-gradient-to-r
          from-blue-400
          via-primary
          to-blue-300
          animate-[progress_1.5s_ease-in-out_infinite]
        "
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={appRoutes[AppRouteNames.SIGN_IN]} replace />;
  }

  const roleFromId =
    user?.roleId && typeof user.roleId === "object" && "name" in user.roleId
      ? (user.roleId as { name: string }).name
      : undefined;
  const roleStr = (user as { role?: string })?.role;
  const userRoles = [
    ...(roleStr ? [roleStr] : []),
    ...(roleFromId ? [roleFromId] : []),
    ...(Array.isArray(user?.roles) ? user.roles : [])
  ].filter(Boolean);

  const allowedByRole =
    roles.length === 0 ||
    user?.isSuperadmin ||
    roles.some(role => userRoles.includes(role));
  const allowedByPermission =
    permissions.length === 0 || permissions.some(p => hasPermission(p));

  if (!allowedByRole && !allowedByPermission) {
    return <Navigate to={appRoutes[AppRouteNames.UNAUTHORIZED]} replace />;
  }

  const getVisibleMenus = (): string[] => {
    if (user?.isSuperadmin) {
      return ALL_VISIBLE_MENUS;
    }
    const existedRole = (user as { existedRole?: string })?.existedRole;
    if (!existedRole || existedRole === 'TTS') {
      return ['home'];
    }
    return (user as { visibleMenus?: string[] })?.visibleMenus ?? DEFAULT_VISIBLE_MENUS;
  };

  const visibleMenus = getVisibleMenus();

  if (requiredMenu && !visibleMenus.includes(requiredMenu)) {
    return <Navigate to={appRoutes[AppRouteNames.HOME]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
