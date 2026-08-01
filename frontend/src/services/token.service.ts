import { AuthObjectKeyEnum } from "@/shared/enums/auth.enum.ts";
import { jwtDecode } from "jwt-decode";
import {
  AuthError,
  AuthErrorType,
  DecodedToken
} from "@/shared/@types/authentication.type.ts";

export default class TokenService {
  private static readonly REFRESH_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes

  static getAccessToken(): string | null {
    return localStorage.getItem(AuthObjectKeyEnum.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(AuthObjectKeyEnum.REFRESH_TOKEN);
  }

  static saveTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(AuthObjectKeyEnum.ACCESS_TOKEN, accessToken);
      localStorage.setItem(AuthObjectKeyEnum.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error("Error saving tokens:", error);
      throw this.createAuthError(
        "unknown",
        "Failed to save authentication tokens"
      );
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(AuthObjectKeyEnum.ACCESS_TOKEN);
    localStorage.removeItem(AuthObjectKeyEnum.REFRESH_TOKEN);
  }

  static decodeToken(token: string | null): DecodedToken | null {
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }

  static isTokenExpired(token: string | null): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp <= currentTime;
  }

  static isTokenExpiringSoon(token: string | null): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp <= currentTime + this.REFRESH_BUFFER_TIME / 1000;
  }

  static getTokenPermissions(token: string | null): string[] {
    const decoded = this.decodeToken(token);
    return decoded?.permissions || [];
  }

  static getTimeUntilExpiry(token: string | null): number {
    const decoded = this.decodeToken(token);
    if (!decoded) return 0;

    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    return Math.max(0, expiryTime - currentTime - this.REFRESH_BUFFER_TIME);
  }

  static createAuthError(
    type: AuthErrorType,
    message: string,
    originalError?: unknown
  ): AuthError {
    return { type, message, originalError };
  }
}
