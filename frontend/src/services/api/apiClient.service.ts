import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import config from "@/shared/constants/config.constant.ts";
import { AuthObjectKeyEnum } from "@/shared/enums/auth.enum.ts";
import { ApiResponse } from "@/shared/@types/api.type.ts";
import {
  ApiRouteNames,
  apiRoutes,
  AppRouteNames,
  appRoutes
} from "@/shared/constants/routes.constant.ts";
import { fePermissionGuard } from "@/shared/services/fe-permission-guard.ts";

const I18N_LOCALE_STORAGE_KEY = "i18nextLng";

function resolveRequestLocale(): string {
  const stored = localStorage.getItem(I18N_LOCALE_STORAGE_KEY);
  const raw = (stored ?? "vi").split("-")[0]?.toLowerCase() ?? "vi";

  if (raw === "ja" || raw === "jp") {
    return "ja";
  }

  return "vi";
}

function unwrapApiData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export default class ApiClientService {
  private readonly client: AxiosInstance;
  private static instance: ApiClientService;

  private constructor() {
    this.client = axios.create({
      baseURL: config.getApiUrl(),
      headers: {
        "Content-Type": "application/json"
      }
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClientService {
    if (!ApiClientService.instance) {
      ApiClientService.instance = new ApiClientService();
    }
    return ApiClientService.instance;
  }

  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return unwrapApiData<T>(response.data);
  }

  private handleLogout(): void {
    localStorage.removeItem(AuthObjectKeyEnum.ACCESS_TOKEN);
    localStorage.removeItem(AuthObjectKeyEnum.REFRESH_TOKEN);

    if (window.location.pathname !== appRoutes[AppRouteNames.SIGN_IN]) {
      window.location.href = appRoutes[AppRouteNames.SIGN_IN];
    }
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const requestConfig: AxiosRequestConfig = { ...config };

    if (typeof FormData !== "undefined" && data instanceof FormData) {
      requestConfig.headers = {
        ...requestConfig.headers,
        "Content-Type": undefined
      };
    }

    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      requestConfig
    );
    return unwrapApiData<T>(response.data);
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return unwrapApiData<T>(response.data);
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config
    );
    return unwrapApiData<T>(response.data);
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return unwrapApiData<T>(response.data);
  }

  public async getBlob(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<Blob>> {
    return this.client.get(url, {
      ...config,
      responseType: "blob",
      transformResponse: [data => data]
    });
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      config => {
        const token = localStorage.getItem(AuthObjectKeyEnum.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        config.headers["Accept-Language"] = resolveRequestLocale();

        const method = (config.method ?? "get").toUpperCase();
        const urlPath = config.url ?? "";
        if (!fePermissionGuard.canAccess(method, urlPath)) {
          return Promise.reject(
            new Error(`FE_PERMISSION_DENIED:${method} ${urlPath}`)
          );
        }

        return config;
      },
      error => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(
              AuthObjectKeyEnum.REFRESH_TOKEN
            );
            if (!refreshToken) {
              this.handleLogout();
              return Promise.reject(error);
            }

            const { data } = await axios.post(
              config.getApiUrl(apiRoutes[ApiRouteNames.REFRESH_TOKEN]),
              { refreshToken },
              { headers: { "Content-Type": "application/json" } }
            );

            const tokens = unwrapApiData<{
              accessToken: string;
              refreshToken: string;
            }>(data);

            localStorage.setItem(
              AuthObjectKeyEnum.ACCESS_TOKEN,
              tokens.accessToken
            );
            localStorage.setItem(
              AuthObjectKeyEnum.REFRESH_TOKEN,
              tokens.refreshToken
            );

            void fePermissionGuard.loadPermissions(true);

            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleLogout();
            return Promise.reject(refreshError);
          }
        }

        if (status === 403) {
          const skipRedirect = originalRequest.headers?.["X-Skip-403-Redirect"];
          if (!skipRedirect) {
            const unauthorizedPath = appRoutes[AppRouteNames.UNAUTHORIZED];
            if (window.location.pathname !== unauthorizedPath) {
              window.location.href = unauthorizedPath;
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

export const apiClient = ApiClientService.getInstance();
