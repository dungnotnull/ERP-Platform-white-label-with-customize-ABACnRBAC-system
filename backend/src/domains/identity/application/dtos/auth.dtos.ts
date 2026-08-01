import { UserOutput } from './user.dtos';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenOutput {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResultOutput {
  tokens: TokenOutput;
  user: UserOutput;
}
