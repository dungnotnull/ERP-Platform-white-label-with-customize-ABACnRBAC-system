import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      this.sanitizeObjectInPlace(request.body);
    }

    return next.handle();
  }

  private sanitizeObjectInPlace(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.sanitizeObjectInPlace(item);
      }
      return;
    }

    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];

        if (typeof value === 'string') {
          (obj as Record<string, unknown>)[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          this.sanitizeObjectInPlace(value);
        }
      }
    }
  }

  private sanitizeString(str: string): string {
    if (!str) return str;

    return str
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/['";]--/g, '')
      .replace(/\/\*/g, '')
      .trim();
  }
}
