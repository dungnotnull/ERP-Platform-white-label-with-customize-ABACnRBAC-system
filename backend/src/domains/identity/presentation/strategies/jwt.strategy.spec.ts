import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@/config/config.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockConfigService = { jwtAccessSecret: 'test-secret' } as Partial<ConfigService>;

  beforeEach(() => {
    strategy = new JwtStrategy(mockConfigService as ConfigService);
  });

  describe('validate', () => {
    it('should return correct user object with valid payload', async () => {
      const bitmap = Buffer.from([0x01, 0x02, 0x03]);
      const payload = {
        sub: 'user-123',
        email: 'user@test.com',
        pv: 5,
        perms: bitmap.toString('base64'),
        sad: false,
        dept: 'dept-1',
        rids: ['role-1', 'role-2'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        _id: 'user-123',
        userId: 'user-123',
        email: 'user@test.com',
        permVersion: 5,
        bitmap: bitmap,
        isSuperadmin: false,
        departmentId: 'dept-1',
        roleIds: ['role-1', 'role-2'],
      });
    });

    it('should decode base64 bitmap to Buffer correctly', async () => {
      const originalBitmap = Buffer.from([0xff, 0xaa, 0x55, 0x00]);
      const payload = {
        sub: 'user-1',
        email: 'user1@test.com',
        pv: 1,
        perms: originalBitmap.toString('base64'),
        sad: false,
        dept: '',
        rids: [],
      };

      const result = await strategy.validate(payload);

      expect(result.bitmap).toEqual(originalBitmap);
      expect(result.bitmap).toBeInstanceOf(Buffer);
    });

    it('should handle missing perms field and return empty Buffer', async () => {
      const payload = {
        sub: 'user-1',
        email: 'user1@test.com',
        pv: 1,
        perms: '',
        sad: false,
        dept: '',
        rids: [],
      };

      const result = await strategy.validate(payload);

      expect(result.bitmap).toEqual(Buffer.alloc(0));
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const payload = {
        email: 'user@test.com',
        pv: 1,
        perms: '',
        sad: false,
        dept: '',
        rids: [],
      };

      await expect(strategy.validate(payload as any)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload as any)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException when sub is empty string', async () => {
      const payload = {
        sub: '',
        email: 'user@test.com',
        pv: 1,
        perms: '',
        sad: false,
        dept: '',
        rids: [],
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should handle empty string departmentId', async () => {
      const payload = {
        sub: 'user-1',
        email: 'user1@test.com',
        pv: 2,
        perms: '',
        sad: false,
        dept: '',
        rids: [],
      };

      const result = await strategy.validate(payload);

      expect(result.departmentId).toBe('');
    });

    it('should preserve isSuperadmin flag correctly', async () => {
      const payload = {
        sub: 'admin-1',
        email: 'admin@test.com',
        pv: 1,
        perms: '',
        sad: true,
        dept: '',
        rids: [],
      };

      const result = await strategy.validate(payload);

      expect(result.isSuperadmin).toBe(true);
    });

    it('should preserve permVersion as number', async () => {
      const payload = {
        sub: 'user-1',
        email: 'user1@test.com',
        pv: 42,
        perms: '',
        sad: false,
        dept: 'dept-5',
        rids: [],
      };

      const result = await strategy.validate(payload);

      expect(result.permVersion).toBe(42);
      expect(typeof result.permVersion).toBe('number');
    });
  });
});
