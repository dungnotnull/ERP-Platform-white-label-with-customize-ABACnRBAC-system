import { User } from "@/shared/@types/user.type.ts";

export type AuthErrorType =
  | "unauthorized"
  | "invalid_credentials"
  | "network_error"
  | "server_error"
  | "unknown";

export interface DecodedToken {
  sub: string;
  email: string;
  name?: string;
  roleId?: string;
  roleIds?: string[];
  role?: string;
  permissions?: string[];
  pv?: number;
  perms?: string;
  sad?: boolean;
  dept?: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: User;
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: unknown;
}
