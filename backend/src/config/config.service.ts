import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>('nodeEnv')!;
  }

  get port(): number {
    return this.config.get<number>('port')!;
  }

  get apiPrefix(): string {
    return this.config.get<string>('apiPrefix')!;
  }

  get mongodbUri(): string {
    return this.config.get<string>('mongodb.uri')!;
  }

  get mongodbDbName(): string {
    return this.config.get<string>('mongodb.dbName')!;
  }

  get mongodbLogSystemUri(): string {
    return this.config.get<string>('mongodbLogSystem.uri')!;
  }

  get mongodbLogSystemDbName(): string {
    return this.config.get<string>('mongodbLogSystem.dbName')!;
  }

  get jwtAccessSecret(): string {
    return this.config.get<string>('jwt.accessSecret')!;
  }

  get jwtRefreshSecret(): string {
    return this.config.get<string>('jwt.refreshSecret')!;
  }

  get jwtAccessExpiration(): string {
    return this.config.get<string>('jwt.accessExpiration')!;
  }

  get jwtRefreshExpiration(): string {
    return this.config.get<string>('jwt.refreshExpiration')!;
  }

  get googleClientId(): string {
    return this.config.get<string>('google.clientId')!;
  }

  get googleClientSecret(): string {
    return this.config.get<string>('google.clientSecret')!;
  }

  get googleCallbackUrl(): string {
    return this.config.get<string>('google.callbackUrl')!;
  }

  get frontendCallbackUrl(): string {
    return this.config.get<string>('google.frontendCallbackUrl')!;
  }

  get corsOrigins(): string {
    return this.config.get<string>('corsOrigins')!;
  }

  get redisHost(): string {
    return this.config.get<string>('redis.host')!;
  }

  get redisPort(): number {
    return this.config.get<number>('redis.port')!;
  }

  get systemDeleteSecret(): string {
    return this.config.get<string>('systemDeleteSecret')!;
  }
}
