import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoginUseCase } from '@/domains/identity/application/use-cases/auth/login.use-case';
import { LoginInput } from '@/domains/identity/application/dtos/auth.dtos';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly loginUseCase: LoginUseCase) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<unknown> {
    try {
      const result = await this.loginUseCase.execute(
        { email, password },
      );
      return result;
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
