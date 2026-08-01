import { apiClient } from "@/services/api/apiClient.service.ts";
import {
  ApiRouteNames,
  apiRoutes
} from "@/shared/constants/routes.constant.ts";
import config from "@/shared/constants/config.constant.ts";
import { AuthResponse } from "@/shared/@types/authentication.type.ts";
import { User } from "@/shared/@types/user.type.ts";
import { normalizeUserProfile } from "@/shared/utils/user.mapper.ts";

interface LoginApiResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user?: User;
}

interface RefreshTokenApiResponse {
  accessToken: string;
  refreshToken: string;
}

function toAuthResponse(data: LoginApiResponse): AuthResponse {
  return {
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    expiresIn: 0,
    user: data.user ? normalizeUserProfile(data.user) : undefined
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<LoginApiResponse>(
      apiRoutes[ApiRouteNames.SIGN_IN],
      { email, password }
    );

    return toAuthResponse(response);
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<LoginApiResponse>(
      apiRoutes[ApiRouteNames.SIGN_UP],
      userData
    );
    return toAuthResponse(response);
  },

  refreshToken: async (
    refreshToken: string
  ): Promise<RefreshTokenApiResponse> => {
    return apiClient.post<RefreshTokenApiResponse>(
      apiRoutes[ApiRouteNames.REFRESH_TOKEN],
      { refreshToken }
    );
  },

  getUserProfile: async (): Promise<User> => {
    const profile = await apiClient.get<User>(apiRoutes[ApiRouteNames.PROFILE]);
    return normalizeUserProfile(profile);
  },

  getGoogleAuthUrl() {
    return config.getApiUrl(apiRoutes[ApiRouteNames.GOOGLE_AUTH]);
  }
};
