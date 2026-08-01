import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/api/apiAuth.service";
import { User } from "@/shared/@types/user.type.ts";
import {
  AuthError,
  AuthResponse
} from "@/shared/@types/authentication.type.ts";
import TokenService from "@/services/token.service.ts";
import { fePermissionGuard } from "@/shared/services/fe-permission-guard.ts";
import { queryKeys } from "@/shared/queries/keys";

interface AuthContextType {
  isLoading: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string) => Promise<User | null>;
  loginWithGoogle: (response: AuthResponse) => Promise<User | null>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const queryClient = useQueryClient();
  const tokenRefreshTimeout = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearRefreshTimeout = useCallback(() => {
    if (tokenRefreshTimeout.current) {
      clearTimeout(tokenRefreshTimeout.current);
      tokenRefreshTimeout.current = null;
    }
  }, []);

  const handleError = useCallback((error: unknown): AuthError => {
    let authError: AuthError;

    if (typeof error === "object" && error !== null) {
      if ("status" in error) {
        const status = (error as { status: number }).status;
        if (status === 401) {
          authError = TokenService.createAuthError(
            "unauthorized",
            "Your session has expired. Please log in again.",
            error
          );
        } else if (status === 403) {
          authError = TokenService.createAuthError(
            "unauthorized",
            "You don't have permission to access this resource.",
            error
          );
        } else {
          authError = TokenService.createAuthError(
            "server_error",
            "An error occurred while communicating with the server.",
            error
          );
        }
      } else {
        authError = TokenService.createAuthError(
          "unknown",
          "An unexpected error occurred.",
          error
        );
      }
    } else {
      authError = TokenService.createAuthError(
        "unknown",
        "An unexpected error occurred.",
        error
      );
    }

    console.error(authError.message, authError.originalError);
    setError(authError);
    return authError;
  }, []);

  const logout = useCallback(() => {
    queryClient.setQueryData(queryKeys.profile, null);
    TokenService.clearTokens();
    fePermissionGuard.invalidate();
    clearRefreshTimeout();
    clearError();
  }, [queryClient, clearRefreshTimeout, clearError]);

  const scheduleTokenRefresh = useCallback(() => {
    clearRefreshTimeout();

    const token = TokenService.getAccessToken();
    if (!token) return;

    const timeUntilExpiry = TokenService.getTimeUntilExpiry(token);

    if (timeUntilExpiry > 0 && timeUntilExpiry < 24 * 60 * 60 * 1000) {
      const refreshTime = Math.min(
        timeUntilExpiry - 5 * 60 * 1000,
        timeUntilExpiry * 0.9
      );
      const timeoutDelay = Math.max(refreshTime, 1000);

      tokenRefreshTimeout.current = setTimeout(async () => {
        await refreshToken();
      }, timeoutDelay);
    }
  }, [clearRefreshTimeout]);

  const refreshTokenFn = async (): Promise<boolean> => {
    const refreshTokenValue = TokenService.getRefreshToken();
    if (!refreshTokenValue) return false;

    try {
      const response = await authApi.refreshToken(refreshTokenValue);
      TokenService.saveTokens(response.accessToken, response.refreshToken);

      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      scheduleTokenRefresh();
      clearError();
      return true;
    } catch (error) {
      handleError(error);
      logout();
      return false;
    }
  };

  const refreshTokenRef = useRef(refreshTokenFn);
  refreshTokenRef.current = refreshTokenFn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refreshToken = useCallback(async (): Promise<boolean> => {
    return refreshTokenRef.current();
  }, []);

  const saveAuthData = useCallback(
    (response: AuthResponse) => {
      TokenService.saveTokens(response.accessToken, response.refreshToken);

      if (response?.user) {
        queryClient.setQueryData(queryKeys.profile, response.user);
      }

      scheduleTokenRefresh();
      fePermissionGuard.loadPermissions(true);
      clearError();
    },
    [queryClient, scheduleTokenRefresh, clearError]
  );

  const login = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      saveAuthData(response);
      setIsLoading(false);
      return response?.user || null;
    } catch (error) {
      const authError = handleError(error);
      setIsLoading(false);

      if (authError.type === "unauthorized") {
        return null;
      }
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<User | null> => {
    setIsLoading(true);

    try {
      const response = await authApi.register({ name, email, password, confirmPassword: password });
      saveAuthData(response);
      setIsLoading(false);
      return response?.user || null;
    } catch (error) {
      handleError(error);
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async (
    response: AuthResponse
  ): Promise<User | null> => {
    setIsLoading(true);

    try {
      saveAuthData(response);
      const profileQuery = await queryClient.fetchQuery({
        queryKey: queryKeys.profile,
        queryFn: async () => {
          const profile = await authApi.getUserProfile();
          if (!profile?._id) throw new Error("Invalid user profile response");
          return profile;
        }
      });

      setIsLoading(false);
      return profileQuery as User | null;
    } catch (error) {
      logout();
      handleError(error);
      setIsLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const accessToken = TokenService.getAccessToken();

        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        if (TokenService.isTokenExpired(accessToken)) {
          const success = await refreshTokenRef.current();
          if (!success) {
            logout();
            setIsLoading(false);
            return;
          }
        }

        await queryClient.fetchQuery({
          queryKey: queryKeys.profile,
          queryFn: async () => {
            const profile = await authApi.getUserProfile();
            if (!profile?._id) throw new Error("Invalid user profile response");
            return profile;
          },
          staleTime: 15 * 60_000
        });

        scheduleTokenRefresh();
      } catch (error) {
        const authError = handleError(error);
        if (authError.type === "unauthorized") {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout]);

  const value: AuthContextType = {
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshToken,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
