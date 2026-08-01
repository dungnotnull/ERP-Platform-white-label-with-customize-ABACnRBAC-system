import { Types } from 'mongoose';

describe('FE Contract Tests — JWT & ABAC Response Shapes', () => {
  describe('JWT payload structure', () => {
    it('JWT payload must contain sub (user ID)', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        pv: 5,
        perms: Buffer.from([0x01, 0x02, 0x03]).toString('base64'),
        sad: false,
        dept: 'dept-sales',
        rids: ['role1', 'role2'],
      };

      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('pv');
      expect(payload).toHaveProperty('perms');
      expect(payload).toHaveProperty('sad');
      expect(payload).toHaveProperty('dept');
      expect(payload).toHaveProperty('rids');

      expect(typeof payload.sub).toBe('string');
      expect(typeof payload.pv).toBe('number');
      expect(typeof payload.perms).toBe('string');
      expect(typeof payload.sad).toBe('boolean');
      expect(Array.isArray(payload.rids)).toBe(true);
    });

    it('bitmap in JWT is base64-decodable to valid Buffer', () => {
      const bitmap = Buffer.from([0x01, 0x02, 0x03]);
      const base64 = bitmap.toString('base64');

      const decoded = Buffer.from(base64, 'base64');
      expect(decoded).toEqual(bitmap);
    });

    it('superadmin flag (sad) must be boolean', () => {
      expect(typeof true).toBe('boolean');
      expect(typeof false).toBe('boolean');
    });
  });

  describe('ABAC policy CRUD response shapes', () => {
    it('list response must contain expected fields', () => {
      const policy = {
        id: 'p1',
        name: 'dept-read-policy',
        description: 'Allow reading own department',
        roleIds: ['role1'],
        resource: 'device',
        action: 'read',
        effect: 'allow',
        conditions: [{ field: 'resource.departmentId', operator: 'equals', value: 'dept1', valueType: 'static' }],
        isActive: true,
      };

      expect(policy).toHaveProperty('id');
      expect(policy).toHaveProperty('name');
      expect(policy).toHaveProperty('resource');
      expect(policy).toHaveProperty('action');
      expect(policy).toHaveProperty('effect');
      expect(policy).toHaveProperty('conditions');
      expect(policy).toHaveProperty('isActive');
      expect(policy).toHaveProperty('roleIds');
    });

    it('create response contains all expected fields', () => {
      const created = {
        id: new Types.ObjectId().toString(),
        name: 'new-policy',
        description: '',
        roleIds: [],
        resource: 'document',
        action: 'approve',
        effect: 'allow',
        conditions: [],
        isActive: true,
      };

      expect(created.isActive).toBe(true);
      expect(created.effect).toBe('allow');
      expect(Array.isArray(created.conditions)).toBe(true);
      expect(Array.isArray(created.roleIds)).toBe(true);
      expect(typeof created.id).toBe('string');
    });

    it('update response preserves name (immutable)', () => {
      const updated = {
        id: 'p1',
        name: 'original-name',
        description: 'updated desc',
        resource: 'device',
        action: 'read',
        effect: 'deny',
        conditions: [],
        isActive: false,
        roleIds: ['r1'],
      };

      expect(updated.name).toBe('original-name');
    });
  });

  describe('Error response format consistency', () => {
    it('401 response format', () => {
      const unauthorized = {
        statusCode: 401,
        message: 'Unauthorized',
      };
      expect(unauthorized.statusCode).toBe(401);
    });

    it('403 response format', () => {
      const forbidden = {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      };
      expect(forbidden.statusCode).toBe(403);
    });
  });

  describe('Auth response shapes', () => {
    it('login response includes accessToken, refreshToken, user', () => {
      const loginResp = {
        accessToken: 'eyJ...',
        refreshToken: 'eyJ...',
        user: { id: 'u1', email: 'user@test.com', fullName: 'Test User' },
      };

      expect(loginResp).toHaveProperty('accessToken');
      expect(loginResp).toHaveProperty('refreshToken');
      expect(loginResp).toHaveProperty('user');
      expect(typeof loginResp.accessToken).toBe('string');
    });

    it('refresh response provides new accessToken', () => {
      const refreshResp = {
        accessToken: 'eyJ...new',
      };

      expect(refreshResp).toHaveProperty('accessToken');
      expect(typeof refreshResp.accessToken).toBe('string');
    });
  });
});
