import {
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      return !!result;
    } catch (error) {
      this.logger.error(`Google auth error: ${error.message}`, error.stack);
      const request = context.switchToHttp().getRequest();
      request.authError = error;
      return true;
    }
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    _info: any,
    context: ExecutionContext,
  ): TUser {
    if (err) throw err;

    if (!user) {
      const request = context.switchToHttp().getRequest();
      request.authInfo = _info;
      return null as unknown as TUser;
    }

    return user;
  }
}
