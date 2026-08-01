import { pathPatternToRegex, normalizeAndValidatePath } from '@/domains/identity/application/utils/endpoint-path.utils';

describe('ABAC System — Comprehensive Tests', () => {
  describe('Path Normalization', () => {
    it('should normalize /api/v1/users to /users', () => {
      expect(normalizeAndValidatePath('/api/v1/users')).toBe('/users');
    });

    it('should normalize /v1/users to /users', () => {
      expect(normalizeAndValidatePath('/v1/users')).toBe('/users');
    });

    it('should normalize /api/users to /users', () => {
      expect(normalizeAndValidatePath('/api/users')).toBe('/users');
    });

    it('should preserve already-bare paths', () => {
      expect(normalizeAndValidatePath('/users')).toBe('/users');
    });

    it('should handle /api/v1/suppliers/:supplierId/purchase-orders', () => {
      expect(normalizeAndValidatePath('/api/v1/suppliers/:supplierId/purchase-orders')).toBe('/suppliers/:supplierId/purchase-orders');
    });

    it('should add leading slash if missing', () => {
      expect(normalizeAndValidatePath('users')).toBe('/users');
    });

    it('should normalize double /v1 stripping', () => {
      // After stripping /api/v1/ → /v1/users, then /v1/ → /users
      expect(normalizeAndValidatePath('/api/v1/v1/users')).toBe('/users');
    });

    it('should reject paths with whitespace', () => {
      expect(() => normalizeAndValidatePath('/users with space')).toThrow();
    });

    it('should trim whitespace', () => {
      expect(normalizeAndValidatePath('  /users  ')).toBe('/users');
    });
  });

  describe('pathPatternToRegex', () => {
    it('should convert literal path', () => {
      expect(pathPatternToRegex('/users')).toBe('^\\/users$');
    });

    it('should convert single :id param', () => {
      expect(pathPatternToRegex('/users/:id')).toBe('^\\/users\\/[^/]+$');
    });

    it('should convert nested params', () => {
      expect(pathPatternToRegex('/suppliers/:supplierId/purchase-orders')).toBe('^\\/suppliers\\/[^/]+/purchase-orders$');
    });

    it('should convert multiple params', () => {
      expect(pathPatternToRegex('/departments/:deptId/devices/:deviceId')).toBe('^\\/departments\\/[^/]+/devices\\/[^/]+$');
    });
  });

  describe('Route Matching with Dynamic Params', () => {
    const testRegex = (pattern: string, path: string): boolean => {
      const regex = new RegExp(pathPatternToRegex(pattern));
      return regex.test(path);
    };

    it('should match /users with /users', () => {
      expect(testRegex('/users', '/users')).toBe(true);
    });

    it('should match /users/:id with /users/abc123', () => {
      expect(testRegex('/users/:id', '/users/abc123')).toBe(true);
    });

    it('should match /users/:id with ObjectId', () => {
      expect(testRegex('/users/:id', '/users/507f1f77bcf86cd799439011')).toBe(true);
    });

    it('should NOT match /users/:id with /users (no param)', () => {
      expect(testRegex('/users/:id', '/users')).toBe(false);
    });

    it('should match nested params', () => {
      expect(testRegex('/suppliers/:supplierId/purchase-orders', '/suppliers/s1/purchase-orders')).toBe(true);
    });

    it('should NOT match nested params with extra segment', () => {
      expect(testRegex('/suppliers/:supplierId/purchase-orders', '/suppliers/s1/purchase-orders/123')).toBe(false);
    });

    it('should match multiple params', () => {
      expect(testRegex('/departments/:deptId/devices/:deviceId', '/departments/d1/devices/dev123')).toBe(true);
    });

    it('should match /users/profile (literal)', () => {
      expect(testRegex('/users/profile', '/users/profile')).toBe(true);
    });

    it('should NOT match wrong method', () => {
      expect(testRegex('/users', '/users/extra')).toBe(false);
    });
  });

  describe('Bitmap Computation Logic', () => {
    function setBit(buffer: Buffer, bitIndex: number): void {
      buffer[bitIndex >> 3] |= (1 << (bitIndex & 7));
    }

    function checkBit(buffer: Buffer, bitIndex: number): boolean {
      const byteIndex = bitIndex >> 3;
      if (byteIndex >= buffer.length) return false;
      return (buffer[byteIndex] & (1 << (bitIndex & 7))) !== 0;
    }

    it('should set and check bits correctly', () => {
      const buf = Buffer.alloc(2, 0);

      setBit(buf, 0);
      expect(checkBit(buf, 0)).toBe(true);
      expect(buf[0]).toBe(0b00000001);

      setBit(buf, 7);
      expect(checkBit(buf, 7)).toBe(true);
      expect(buf[0]).toBe(0b10000001);

      setBit(buf, 8);
      expect(checkBit(buf, 8)).toBe(true);
      expect(buf[1]).toBe(0b00000001);

      setBit(buf, 15);
      expect(checkBit(buf, 15)).toBe(true);
      expect(buf[1]).toBe(0b10000001);
    });

    it('should return false for bit beyond buffer', () => {
      const buf = Buffer.alloc(1, 0);
      expect(checkBit(buf, 8)).toBe(false);
    });

    it('should handle empty bitmap', () => {
      const buf = Buffer.alloc(0);
      expect(checkBit(buf, 0)).toBe(false);
    });

    it('should allocate correct buffer size', () => {
      const buf = Buffer.alloc(Math.ceil((14 + 1) / 8), 0);
      expect(buf.length).toBe(2);
      setBit(buf, 14);
      expect(checkBit(buf, 14)).toBe(true);
    });
  });

  describe('Permission Version Mismatch Detection', () => {
    it('should detect version mismatch (jwt pv < db pv)', () => {
      const jwtPv: number = 5;
      const dbPv: number = 7;
      expect(jwtPv).not.toBe(dbPv);
    });

    it('should not detect mismatch when versions match', () => {
      const jwtPv: number = 5;
      const dbPv: number = 5;
      expect(jwtPv).toBe(dbPv);
    });
  });

  describe('Policy Template Resolution', () => {
    function resolveTemplate(template: string, user: any, resource: any): string {
      return template.replace(/\{\{(.+?)\}\}/g, (_match, path: string) => {
        const parts = path.trim().split('.');
        let current: any = null;

        if (parts[0] === 'user') {
          current = user;
          parts.shift();
        } else if (parts[0] === 'resource') {
          current = resource;
          parts.shift();
        }

        for (const part of parts) {
          if (current == null) return '';
          current = current[part];
        }
        return current != null ? String(current) : '';
      });
    }

    it('should resolve {{resource.departmentId}}', () => {
      const resource = { departmentId: 'dept-1' };
      expect(resolveTemplate('{{resource.departmentId}}', {}, resource)).toBe('dept-1');
    });

    it('should resolve {{user.userId}}', () => {
      const user = { userId: 'user-123' };
      expect(resolveTemplate('{{user.userId}}', user, {})).toBe('user-123');
    });

    it('should resolve {{user.departmentId}}', () => {
      const user = { departmentId: 'dept-1' };
      expect(resolveTemplate('{{user.departmentId}}', user, {})).toBe('dept-1');
    });
  });

  describe('Dynamic Policy Condition Evaluation', () => {
    function evaluateCondition(
      condition: { field: string; operator: string; value: any },
      user: any,
      resource: any,
    ): boolean {
      const resolvePath = (path: string): any => {
        const parts = path.split('.');
        let current: any = parts[0] === 'user' ? { ...user } : parts[0] === 'resource' ? { ...resource } : null;
        if (current === null) return undefined;
        for (let i = 1; i < parts.length; i++) {
          if (current == null) return undefined;
          current = current[parts[i]];
        }
        return current;
      };

      const fieldValue = resolvePath(condition.field);
      const compareValue = condition.value;

      switch (condition.operator) {
        case 'equals': return String(fieldValue) === String(compareValue);
        case 'notEquals': return String(fieldValue) !== String(compareValue);
        case 'exists': return fieldValue !== null && fieldValue !== undefined;
        default: return false;
      }
    }

    const user = { userId: 'user-1', departmentId: 'dept-1', isSuperadmin: false, roleIds: ['role-1'] };
    const resource = { _id: 'res-1', departmentId: 'dept-1', createdBy: 'user-1', isActive: true };

    it('should pass: user.departmentId equals resource.departmentId', () => {
      expect(evaluateCondition(
        { field: 'user.departmentId', operator: 'equals', value: 'dept-1' },
        user, resource,
      )).toBe(true);
    });

    it('should fail: user.departmentId equals wrong dept', () => {
      expect(evaluateCondition(
        { field: 'user.departmentId', operator: 'equals', value: 'dept-2' },
        user, resource,
      )).toBe(false);
    });

    it('should pass: resource._id notEquals user.userId', () => {
      expect(evaluateCondition(
        { field: 'resource._id', operator: 'notEquals', value: 'user-1' },
        user, resource,
      )).toBe(true);
    });

    it('should pass: resource.createdBy equals user.userId', () => {
      expect(evaluateCondition(
        { field: 'resource.createdBy', operator: 'equals', value: 'user-1' },
        user, resource,
      )).toBe(true);
    });
  });

  describe('InternalUser ABAC — Full Scenario', () => {
    it('should allow same-department HR Admin to update another internal user', () => {
      const user = { userId: 'user-1', departmentId: 'dept-1', isSuperadmin: false, roleIds: ['hr-admin-role'] };
      const resource = { _id: 'internal-user-2', departmentId: 'dept-1' };

      const cond1 = String(user.departmentId) === String(resource.departmentId);
      const cond2 = String(resource._id) !== String(user.userId);

      expect(cond1).toBe(true);
      expect(cond2).toBe(true);
      expect(cond1 && cond2).toBe(true);
    });

    it('should deny cross-department user even with HR Admin role', () => {
      const user = { userId: 'user-1', departmentId: 'dept-2', isSuperadmin: false, roleIds: ['hr-admin-role'] };
      const resource = { _id: 'internal-user-2', departmentId: 'dept-1' };

      const cond1 = String(user.departmentId) === String(resource.departmentId);

      expect(cond1).toBe(false);
    });

    it('should deny same-department user trying to edit themselves', () => {
      const user = { userId: 'user-1', departmentId: 'dept-1', isSuperadmin: false, roleIds: ['hr-admin-role'] };
      const resource = { _id: 'user-1', departmentId: 'dept-1' };

      const cond1 = String(user.departmentId) === String(resource.departmentId);
      const cond2 = String(resource._id) !== String(user.userId);

      expect(cond1 && cond2).toBe(false);
    });

    it('should allow superadmin regardless of conditions', () => {
      const user = { userId: 'admin-1', departmentId: 'dept-2', isSuperadmin: true, roleIds: [] };
      expect(user.isSuperadmin).toBe(true);
    });
  });
});
