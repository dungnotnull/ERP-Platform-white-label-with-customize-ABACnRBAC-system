import { ActivityLoggingInterceptor } from './activity-logging.interceptor';
import { ActivityLogBuffer } from '@/domains/activity-log/infrastructure/services/activity-log-buffer';
import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockExecutionContext = (method: string, path: string, user?: any, body?: any, opts?: { resOverrides?: any }) => {
  const req: any = {
    method,
    originalUrl: path,
    path,
    ip: '127.0.0.1',
    user,
    body,
    get: (header: string) =>
      header === 'user-agent' ? 'TestAgent/1.0' : undefined,
    res: opts?.resOverrides ?? { statusCode: 200 },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({ statusCode: 200 }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
};

describe('ActivityLoggingInterceptor', () => {
  let interceptor: ActivityLoggingInterceptor;
  let mockBuffer: { push: jest.Mock };

  beforeEach(() => {
    mockBuffer = { push: jest.fn() };
    interceptor = new ActivityLoggingInterceptor(mockBuffer as any);
  });

  it('skips logging for GET requests', async () => {
    const ctx = mockExecutionContext('GET', '/api/v1/devices');
    const handler = { handle: () => of({ items: [] }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).not.toHaveBeenCalled();
  });

  it('skips logging for HEAD requests', async () => {
    const ctx = mockExecutionContext('HEAD', '/api/v1/health');
    const handler = { handle: () => of(null) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).not.toHaveBeenCalled();
  });

  it('skips logging for OPTIONS requests', async () => {
    const ctx = mockExecutionContext('OPTIONS', '/api/v1/devices');
    const handler = { handle: () => of(null) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).not.toHaveBeenCalled();
  });

  it('logs POST requests as CREATE action', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/devices', {
      userId: 'u1',
      email: 'admin@example.com',
      name: 'Admin',
      isSuperadmin: true,
    }, { name: 'New Device', type: 'Laptop' });
    const handler = { handle: () => of({ id: 'device-1' }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        userEmail: 'admin@example.com',
        userName: 'Admin',
        isSuperadmin: true,
        action: 'CREATE',
        method: 'POST',
        endpoint: '/api/v1/devices',
        ipAddress: '127.0.0.1',
        requestBody: { name: 'New Device', type: 'Laptop' },
      }),
    );
  });

  it('logs PUT requests as UPDATE action', async () => {
    const ctx = mockExecutionContext('PUT', '/api/v1/devices/abc', {
      userId: 'u1',
    });
    const handler = { handle: () => of({ id: 'device-abc' }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        method: 'PUT',
      }),
    );
  });

  it('logs PATCH requests as UPDATE action', async () => {
    const ctx = mockExecutionContext('PATCH', '/api/v1/devices/abc/status');
    const handler = { handle: () => of({}) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        method: 'PATCH',
      }),
    );
  });

  it('logs DELETE requests as DELETE action', async () => {
    const ctx = mockExecutionContext('DELETE', '/api/v1/devices/abc');
    const handler = { handle: () => of(null) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        method: 'DELETE',
      }),
    );
  });

  it('logs login POST requests as LOGIN action', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/auth/login', null, {
      email: 'user@example.com',
    });
    const handler = { handle: () => of({ accessToken: '...' }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN',
        userEmail: 'user@example.com',
      }),
    );
  });

  it('logs register POST requests as REGISTER action', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/auth/register', null, {
      email: 'new@example.com',
    });
    const handler = { handle: () => of({ id: 'new-user' }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REGISTER',
        userEmail: 'new@example.com',
      }),
    );
  });

  it('records status code from error when request fails', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/devices');
    const error = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const handler = { handle: () => throwError(() => error) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        error: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });

  it('falls back to 500 when error has no status code', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/devices', undefined, undefined, { resOverrides: {} });
    const handler = { handle: () => throwError(() => new Error('Boom')) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        error: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      }),
    );
  });

  it('records responseTimeMs as a positive number', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/devices');
    const handler = { handle: () => of({}) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        responseTimeMs: expect.any(Number),
      }),
    );
    const callArg = mockBuffer.push.mock.calls[0][0];
    expect(callArg.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('passes response through unchanged', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/devices');
    const responseData = { id: 'device-1', name: 'Laptop' };
    const handler = { handle: () => of(responseData) };

    let captured: any;
    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        next: (val) => {
          captured = val;
        },
        complete: () => resolve(),
      });
    });

    expect(captured).toEqual(responseData);
  });

  it('strips sensitive fields from request body', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/auth/login', null, {
      email: 'user@example.com',
      password: 'secret123',
      refreshToken: 'rt-abc',
      name: 'User',
    });
    const handler = { handle: () => of({ accessToken: '...' }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    const log = mockBuffer.push.mock.calls[0][0];
    expect(log.requestBody).toEqual({ email: 'user@example.com', name: 'User' });
  });

  it('caps request body to 20 keys', async () => {
    const body: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      body[`field${i}`] = `value${i}`;
    }
    const ctx = mockExecutionContext('POST', '/api/v1/devices', {
      userId: 'u1',
      email: 'admin@example.com',
      isSuperadmin: false,
    }, body);
    const handler = { handle: () => of({}) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    const log = mockBuffer.push.mock.calls[0][0];
    expect(Object.keys(log.requestBody)).toHaveLength(20);
  });

  it('sets requestBody to null when body is empty', async () => {
    const ctx = mockExecutionContext('DELETE', '/api/v1/devices/abc', {
      userId: 'u1',
      email: 'admin@example.com',
    });
    const handler = { handle: () => of(null) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    const log = mockBuffer.push.mock.calls[0][0];
    expect(log.requestBody).toBeNull();
  });

  it('captures isSuperadmin from user', async () => {
    const ctx = mockExecutionContext('POST', '/api/v1/devices', {
      userId: 'u1',
      email: 'admin@example.com',
      isSuperadmin: true,
    });
    const handler = { handle: () => of({}) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    const log = mockBuffer.push.mock.calls[0][0];
    expect(log.isSuperadmin).toBe(true);
  });

  it('captures userEmail from Google OAuth profile on callback', async () => {
    const ctx = mockExecutionContext('GET', '/api/v1/auth/google/callback', {
      email: 'user@example.com',
      name: 'Google User',
      profilePicture: 'https://photo.url',
      provider: 'GOOGLE',
      providerId: 'g-123',
    });
    const handler = { handle: () => of({}) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(ctx, handler as any).subscribe({
        complete: () => resolve(),
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuffer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN',
        userEmail: 'user@example.com',
        userName: 'Google User',
        method: 'GOOGLE',
        endpoint: 'Google Login',
      }),
    );
  });
});
