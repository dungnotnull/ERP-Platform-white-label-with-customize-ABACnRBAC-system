import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import _ from 'lodash';
import { ActivityLogEntity } from '@/domains/activity-log/domain/entities/activity-log.entity';
import { ActivityAction } from '@/domains/activity-log/domain/enums/activity-action.enum';
import { ActivityLogBuffer } from '@/domains/activity-log/infrastructure/services/activity-log-buffer';

const EXCLUDED_METHODS = new Set(['HEAD', 'OPTIONS']);
const LOGGED_GET_PATHS = ['/auth/google/callback'];
const SENSITIVE_BODY_KEYS = new Set([
  'password', 'currentPassword', 'newPassword', 'confirmPassword',
  'refreshToken', 'accessToken', 'secret',
]);
const MAX_BODY_KEYS = 20;

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLoggingInterceptor.name);

  constructor(private readonly activityLogBuffer: ActivityLogBuffer) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = (request.method ?? '').toUpperCase();

    const path = request.originalUrl ?? request.path ?? '';

    if (method === 'GET' && !LOGGED_GET_PATHS.some((p) => path.toLowerCase().includes(p))) {
      return next.handle();
    }

    if (EXCLUDED_METHODS.has(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logActivity(request, startTime),
        error: (error) => this.logActivity(request, startTime, error),
      }),
    );
  }

  private logActivity(request: any, startTime: number, error?: any): void {
    try {
      const activity = this.buildActivity(request, startTime, error);
      this.activityLogBuffer.push(activity);
    } catch (err) {
      this.logger.error('Failed to buffer activity log', err);
    }
  }

  private buildActivity(request: any, startTime: number, error?: any): ActivityLogEntity {
    const user = request.user;
    const method = (request.method ?? '').toUpperCase();
    const path = request.originalUrl ?? request.path ?? '';
    const statusCode = error?.getStatus?.() ?? request.res?.statusCode ?? 500;
    const responseTimeMs = Date.now() - startTime;
    const action = this.determineAction(method, path);
    const isGoogleCallback = path.toLowerCase().includes('/auth/google/callback');

    return ActivityLogEntity.create({
      userId: user?.userId ?? user?._id ?? null,
      userEmail: user?.email ?? request.body?.email ?? null,
      userName: user?.name ?? null,
      isSuperadmin: user?.isSuperadmin ?? null,
      action,
      method: isGoogleCallback ? 'GOOGLE' : method,
      endpoint: isGoogleCallback ? 'Google Endpoint Secret (hidden for credential)' : path,
      statusCode,
      ipAddress: request.ip ?? '',
      userAgent: (request.get?.('user-agent') ?? '').substring(0, 200),
      requestBody: this.sanitizeBody(request.body),
      responseTimeMs,
    });
  }

  private sanitizeBody(body: any): Record<string, any> | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }

    const picked = _.chain(body)
      .omitBy((_v, key) => SENSITIVE_BODY_KEYS.has(key))
      .pickBy((_v, key) => typeof key === 'string')
      .toPairs()
      .take(MAX_BODY_KEYS)
      .fromPairs()
      .value();

    return _.isEmpty(picked) ? null : picked;
  }

  private determineAction(method: string, path: string): ActivityAction {
    const normalizedPath = path.toLowerCase();
    if (normalizedPath.includes('/auth/login') || normalizedPath.includes('/auth/google/callback')) {
      return ActivityAction.LOGIN;
    }
    if (normalizedPath.includes('/auth/register')) {
      return ActivityAction.REGISTER;
    }

    switch (method) {
      case 'POST':
        return ActivityAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return ActivityAction.UPDATE;
      case 'DELETE':
        return ActivityAction.DELETE;
      default:
        return ActivityAction.UPDATE;
    }
  }
}
