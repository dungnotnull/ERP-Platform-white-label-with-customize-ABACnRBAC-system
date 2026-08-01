import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './shared/presentation/interceptors/response-transform.interceptor';
import { ActivityLoggingInterceptor } from './domains/activity-log/presentation/interceptors/activity-logging.interceptor';
import { Reflector } from '@nestjs/core';
import { RequestLoggingMiddleware } from './shared/presentation/middleware/request-logging.middleware';
import * as express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('App');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix(configService.apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
    }),
  );
  app.use(compression());

  app.use(
    hpp({
      checkBody: true,
      checkBodyOnlyForContentType: 'urlencoded',
    }),
  );

  app.enableCors({
    origin: configService.corsOrigins
      ? configService.corsOrigins.split(',').map((s: string) => s.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // allowedHeaders: ['*'],
    exposedHeaders: ['set-cookie']
  });

  // Skip body parsers for multipart/form-data requests (handled by Multer)
  app.use((req: any, res: any, next: any) => {
    if (req.is('multipart/form-data')) {
      next();
    } else {
      express.json({ limit: '1mb' })(req, res, next);
    }
  });
  app.use((req: any, res: any, next: any) => {
    if (req.is('multipart/form-data')) {
      next();
    } else {
      express.urlencoded({ extended: true, limit: '1mb' })(req, res, next);
    }
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(app.get(Reflector)),
    app.get(ActivityLoggingInterceptor),
  );

  const requestLoggingMiddleware = app.get(RequestLoggingMiddleware);
  app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DYM Management API')
    .setDescription('Unified management system API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${configService.apiPrefix}/docs`, app, document);

  app.enableShutdownHooks();

  const port = configService.port;
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
      const pid = out.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid) && Number(pid) !== process.pid) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch {
      // no process on this port — proceed normally
    }
  }
  await app.listen(port);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Application is running on: http://localhost:${configService.port}`);
    logger.log(`Health check: http://localhost:${configService.port}/api/v1/health`);
    logger.log(`Swagger documentation: http://localhost:${configService.port}/api/docs`);
  }
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to bootstrap the application', error);
  process.exit(1);
});
