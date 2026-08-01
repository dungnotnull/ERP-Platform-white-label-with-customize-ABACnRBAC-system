export interface AccessTokenPayload {
  sub: string;
  email: string;
  pv: number;
  perms: string;
  sad: boolean;
  dept: string;
  rids: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface TokenGeneratorPort {
  generateAccessToken(payload: AccessTokenPayload): string;
  generateRefreshToken(payload: RefreshTokenPayload): string;
  verifyRefreshToken(token: string): RefreshTokenPayload;
}
