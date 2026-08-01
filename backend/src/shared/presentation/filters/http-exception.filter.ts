import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  hasApiErrorMessage,
  resolveApiErrorMessage,
} from '@/shared/infrastructure/i18n/api-error.messages';
import { parseRequestLocale } from '@/shared/infrastructure/i18n/parse-request-locale';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errorCode?: string;
  params?: Record<string, string>;
  statusCode: number;
  details?: unknown[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;
    let errorCode: string | undefined;
    let params: Record<string, string> | undefined;
    let details: unknown[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        if (Array.isArray(resp.message)) {
          details = resp.message as string[];
          message = 'Validation failed';
        }
        error = resp.error as string;
        if (typeof resp.errorCode === 'string') {
          errorCode = resp.errorCode;
        }
        if (resp.params && typeof resp.params === 'object') {
          params = resp.params as Record<string, string>;
        }
      }
    } else if (this.isDomainException(exception)) {
      status = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;
      params = exception.params;
    } else if (this.isMongoDuplicateKeyError(exception)) {
      status = HttpStatus.CONFLICT;
      const parsed = this.parseMongoDuplicateKeyError(exception);
      errorCode = parsed.errorCode;
      params = parsed.params;
      message = '';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    const locale = parseRequestLocale(request.headers['accept-language'] as string);

    if (message === 'Validation failed') {
      errorCode = errorCode ?? 'VALIDATION_FAILED';
    }

    if (errorCode && hasApiErrorMessage(errorCode)) {
      message = resolveApiErrorMessage(errorCode, params, locale);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      statusCode: status,
    };

    if (error) errorResponse.error = error;
    if (errorCode) errorResponse.errorCode = errorCode;
    if (params) errorResponse.params = params;
    if (details) errorResponse.details = details;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private isDomainException(
    exception: unknown,
  ): exception is Error & {
    statusCode: number;
    errorCode?: string;
    params?: Record<string, string>;
  } {
    return (
      exception instanceof Error &&
      'statusCode' in exception &&
      typeof (exception as { statusCode: unknown }).statusCode === 'number'
    );
  }

  private isMongoDuplicateKeyError(
    exception: unknown,
  ): exception is Error & { code?: number } {
    if (!(exception instanceof Error)) {
      return false;
    }

    const code = (exception as { code?: number }).code;
    if (code === 11000) {
      return true;
    }

    return exception.message.includes('E11000 duplicate key');
  }

  private parseMongoDuplicateKeyError(exception: Error): {
    errorCode: string;
    params?: Record<string, string>;
  } {
    const raw = exception.message;

    if (raw.includes('email')) {
      const match = raw.match(/email:\s*"([^"]+)"/i);
      const email = match?.[1] ?? '';
      return {
        errorCode: 'EMPLOYEE_DUPLICATE_EMAIL',
        params: { email },
      };
    }

    if (raw.includes('employeeCode')) {
      const match = raw.match(/employeeCode:\s*"([^"]+)"/i);
      const employeeCode = match?.[1] ?? '';
      return {
        errorCode: 'EMPLOYEE_DUPLICATE_EMPLOYEE_CODE',
        params: { employeeCode },
      };
    }

    if (raw.includes('nameVi')) {
      const match = raw.match(/nameVi:\s*"([^"]+)"/i);
      const name = match?.[1] ?? '';
      return {
        errorCode: 'DUPLICATE_POSITION_NAME',
        params: { name },
      };
    }

    if (raw.includes('code:')) {
      const match = raw.match(/code:\s*"([^"]+)"/i);
      const code = match?.[1] ?? '';
      return {
        errorCode: 'DUPLICATE_DEPARTMENT_CODE',
        params: { code },
      };
    }

    return {
      errorCode: 'DUPLICATE_DATA',
    };
  }
}
