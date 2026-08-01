import type { QueryClient } from "@tanstack/react-query";
import TokenService from "@/services/token.service.ts";
import { User } from "@/shared/@types/user.type.ts";
import { queryKeys } from "@/shared/queries/keys";

export const PermissionDeniedReason = {
  NOT_AUTHENTICATED: "not_authenticated",
  NO_PERMISSION: "no_permission"
} as const;

export type PermissionDeniedReasonType =
  (typeof PermissionDeniedReason)[keyof typeof PermissionDeniedReason];

interface PermissionDeniedEvent {
  reason: PermissionDeniedReasonType;
  method: string;
  path: string;
}

type PermissionDeniedListener = (event: PermissionDeniedEvent) => void;

function matchPath(pattern: string, requestPath: string): boolean {
  if (pattern === requestPath) return true;
  if (!pattern.includes(":")) return false;
  const regexStr = pattern.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
  return new RegExp("^" + regexStr + "$").test(requestPath);
}

class FePermissionGuard {
  private queryClient: QueryClient | null = null;
  private listeners: Set<PermissionDeniedListener> = new Set();

  private publicPaths: Set<string> = new Set([
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/google",
    "/auth/google-url",
    "/auth/google/callback",
    "/health",
    "/users/profile"
  ]);

  private authenticatedPublicPaths: Set<string> = new Set([
    "/rooms",
    "/rooms/*",
    // "/meeting-rooms",
    // "/meeting-rooms/*",
    "/bookings",
    "/bookings/*",
    // "/departments",
    // "/departments/*",
    // "/users",
    // "/users/*",
    // "/internal-users",
    // "/internal-users/*"
  ]);

  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  onPermissionDenied(listener: PermissionDeniedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitDenied(
    reason: PermissionDeniedReasonType,
    method: string,
    path: string
  ) {
    const event: PermissionDeniedEvent = { reason, method, path };
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch {
        /* swallow */
      }
    });
  }

  loadPermissions(force = false): void {
    if (!this.queryClient) return;
    if (force) {
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    } else {
      void this.queryClient.refetchQueries({
        queryKey: queryKeys.profile,
        type: "active"
      });
    }
  }

  canAccess(method: string, urlPath: string): boolean {
    const token = TokenService.getAccessToken();
    if (!token) {
      this.emitDenied(
        PermissionDeniedReason.NOT_AUTHENTICATED,
        method,
        urlPath
      );
      return false;
    }

    const decoded = TokenService.decodeToken(token);
    if (!decoded) {
      this.emitDenied(
        PermissionDeniedReason.NOT_AUTHENTICATED,
        method,
        urlPath
      );
      return false;
    }

    if (decoded.sad) return true;

    const cleanPath = urlPath.split("?")[0];
    if (this.publicPaths.has(cleanPath)) return true;

    if (this.isAuthenticatedPublicPath(cleanPath)) return true;

    console.log("[PermissionGuard] Blocked API:", { method, path: cleanPath, urlPath });

    const profile = this.queryClient?.getQueryData<User>(queryKeys.profile);
    if (!profile) return true;

    const allowedPaths = (profile.permissions ?? [])
      .map(p => (typeof p === "string" ? p : (p?.name ?? "")))
      .filter(Boolean);

    const allowed = allowedPaths.some(p => {
      const [permMethod, permPath] = p.split(":");
      if (permMethod !== method.toUpperCase()) return false;
      return matchPath(permPath, cleanPath);
    });

    if (!allowed) {
      this.emitDenied(PermissionDeniedReason.NO_PERMISSION, method, cleanPath);
    }

    return allowed;
  }

  invalidate(): void {
    if (this.queryClient) {
      this.queryClient.removeQueries({ queryKey: queryKeys.profile });
    }
  }

  private isAuthenticatedPublicPath(path: string): boolean {
    for (const publicPath of this.authenticatedPublicPaths) {
      if (publicPath.endsWith("/*")) {
        const basePath = publicPath.slice(0, -2);
        if (path === basePath || path.startsWith(basePath + "/")) {
          return true;
        }
      } else if (publicPath === path) {
        return true;
      }
    }
    return false;
  }
}

export const fePermissionGuard = new FePermissionGuard();
