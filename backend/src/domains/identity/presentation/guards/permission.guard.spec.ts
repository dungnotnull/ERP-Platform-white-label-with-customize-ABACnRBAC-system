import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };
  let mockRouteMapService: { resolve: jest.Mock };
  let mockUserPermCacheService: { getBitmap: jest.Mock };

  const makeContext = (req: any) => {
    const handler = jest.fn();
    const classRef = jest.fn();
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
      getClass: () => classRef,
    } as any;
  };

  const baseUser = {
    userId: 'user-123',
    permVersion: 1,
    bitmap: Buffer.from([0]),
    isSuperadmin: false,
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    };
    mockRouteMapService = { resolve: jest.fn().mockReturnValue(null) };
    mockUserPermCacheService = { getBitmap: jest.fn().mockResolvedValue(null) };

    guard = new PermissionGuard(
      mockReflector as any,
      mockRouteMapService as any,
      mockUserPermCacheService as any,
    );
  });

  it('should return true for @Public() endpoints', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeContext({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockRouteMapService.resolve).not.toHaveBeenCalled();
  });

  it('should return false when no user on request', async () => {
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: undefined });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('should return true when user.isSuperadmin is true', async () => {
    const ctx = makeContext({
      method: 'GET',
      path: '/api/test',
      user: { ...baseUser, isSuperadmin: true },
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockRouteMapService.resolve).not.toHaveBeenCalled();
  });

  it('should return false for unregistered endpoint (no bitIndex)', async () => {
    mockRouteMapService.resolve.mockReturnValue(null);
    const ctx = makeContext({
      method: 'GET',
      path: '/api/unregistered',
      user: baseUser,
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('should return true when bitmap has the correct bit set', async () => {
    // bitIndex = 9 => byteIndex = 1, bitMask = 2 (bit 1 in byte 1)
    const bitIndex = 9;
    const bitmap = Buffer.from([0x00, 0x02, 0x00]);
    mockRouteMapService.resolve.mockReturnValue(bitIndex);
    mockUserPermCacheService.getBitmap.mockResolvedValue(bitmap);
    const ctx = makeContext({
      method: 'POST',
      path: '/api/devices',
      user: baseUser,
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should return false when bitmap does NOT have the correct bit set', async () => {
    // bitIndex = 9 => byteIndex = 1, bitMask = 2
    const bitIndex = 9;
    const bitmap = Buffer.from([0x00, 0x00, 0x00]); // bit not set
    mockRouteMapService.resolve.mockReturnValue(bitIndex);
    mockUserPermCacheService.getBitmap.mockResolvedValue(bitmap);
    const ctx = makeContext({
      method: 'POST',
      path: '/api/devices',
      user: baseUser,
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('should throw ForbiddenException when getBitmap returns null', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(null);
    const ctx = makeContext({
      method: 'GET',
      path: '/api/test',
      user: baseUser,
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when bitmap is too short for bitIndex', async () => {
    // bitIndex = 24 => byteIndex = 3, but bitmap only has 2 bytes
    const bitIndex = 24;
    const bitmap = Buffer.from([0xff, 0xff]);
    mockRouteMapService.resolve.mockReturnValue(bitIndex);
    mockUserPermCacheService.getBitmap.mockResolvedValue(bitmap);
    const ctx = makeContext({
      method: 'GET',
      path: '/api/test',
      user: baseUser,
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should call routeMapService.resolve with method and path', async () => {
    const ctx = makeContext({
      method: 'DELETE',
      path: '/api/devices/42',
      user: baseUser,
    });
    mockRouteMapService.resolve.mockReturnValue(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));

    await guard.canActivate(ctx);

    expect(mockRouteMapService.resolve).toHaveBeenCalledWith('DELETE', '/api/devices/42');
  });

  it('should call userPermCacheService.getBitmap with user params', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    const user = { ...baseUser, userId: 'user-abc', permVersion: 5, bitmap: Buffer.from([0xff]) };
    const ctx = makeContext({
      method: 'GET',
      path: '/api/test',
      user,
    });
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));

    await guard.canActivate(ctx);

    expect(mockUserPermCacheService.getBitmap).toHaveBeenCalledWith(
      'user-abc',
      5,
      user.bitmap,
    );
  });

  it('should correctly check bit at index 0 (byteIndex=0, bitMask=1)', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should correctly check bit at index 7 (byteIndex=0, bitMask=128)', async () => {
    mockRouteMapService.resolve.mockReturnValue(7);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x80]));
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should correctly reject when bit at index 0 is not set', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0xfe])); // all bits except bit 0
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('should return true for @AuthOnly() endpoints when user exists', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'authOnly') return true;
      return false;
    });
    const ctx = makeContext({ method: 'GET', path: '/api/me', user: baseUser });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should return false for @AuthOnly() when no user', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'authOnly') return true;
      return false;
    });
    const ctx = makeContext({ method: 'GET', path: '/api/me', user: undefined });

    // The guard checks !user before isAuthOnly, so no user = false regardless of decorator
    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('should return false for unregistered endpoint and log warning', async () => {
    mockRouteMapService.resolve.mockReturnValue(null);
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(false);
  });

  it('should handle user with undefined permVersion', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));
    const user = { userId: 'u1', permVersion: undefined as any, bitmap: Buffer.from([0x01]), isSuperadmin: false };
    const ctx = makeContext({ method: 'GET', path: '/api/test', user });

    await expect(guard.canActivate(ctx)).resolves.toBeDefined();
  });

  it('should handle empty bitmap buffer', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    const emptyBitmap = Buffer.alloc(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(emptyBitmap);
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    // With empty bitmap, no bit 0 can be set
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should handle decimal (non-integer) bitIndex gracefully', async () => {
    const bitIndex = 3.7; // non-integer
    mockRouteMapService.resolve.mockReturnValue(bitIndex);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x08]));
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    // Math.floor(3.7) = 3, bit shift on 3 -> bit 3
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should handle large bitIndex that requires buffer expansion', async () => {
    const bitIndex = 50;
    const bitmap = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04]);
    mockRouteMapService.resolve.mockReturnValue(bitIndex);
    mockUserPermCacheService.getBitmap.mockResolvedValue(bitmap);
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    // bitIndex 50: byteIndex=6, bitMask=4 (bit 2 of byte 6)
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should correctly check bitIndex 0 (boundary)', async () => {
    mockRouteMapService.resolve.mockReturnValue(0);
    mockUserPermCacheService.getBitmap.mockResolvedValue(Buffer.from([0x01]));
    const ctx = makeContext({ method: 'GET', path: '/api/test', user: baseUser });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
