import { Module } from '@nestjs/common';
import { RequestLoggingMiddleware } from './presentation/middleware/request-logging.middleware';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  controllers: [HealthController],
  providers: [RequestLoggingMiddleware],
  exports: [RequestLoggingMiddleware],
})
export class SharedModule {}
