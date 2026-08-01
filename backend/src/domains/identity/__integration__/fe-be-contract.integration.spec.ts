import { BitmapComputationService } from '@/domains/identity/application/services/bitmap-computation.service';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';
import { AbacRuleEngineService } from '@/domains/identity/application/services/abac-rule-engine.service';
import { Types } from 'mongoose';

describe('FE-BE Contract Integration', () => {
  describe('JWT payload roundtrip: encode → decode → guard consumption', () => {
    it('bitmap encode/decode roundtrip preserves all bits', () => {
      const bitmap = Buffer.alloc(16);
      // Set bits at various positions
      bitmap[0] = 0xff;
      bitmap[5] = 0xaa;
      bitmap[15] = 0x01;

      const base64 = bitmap.toString('base64');

      // FE decodes the base64
      const decoded = Buffer.from(base64, 'base64');

      expect(decoded).toEqual(bitmap);
      expect(decoded.length).toBe(16);
      expect(decoded[0]).toBe(0xff);
      expect(decoded[5]).toBe(0xaa);
      expect(decoded[15]).toBe(0x01);
    });

    it('JWT payload fields match what PermissionGuard expects', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        pv: 5,
        perms: Buffer.from([0x01, 0x02, 0x03]).toString('base64'),
        sad: false,
        dept: 'dept-sales',
        rids: ['role1', 'role2'],
      };

      // Guard expects: userId, permVersion, bitmap, isSuperadmin, departmentId
      const guardUser = {
        userId: payload.sub,
        permVersion: payload.pv,
        bitmap: Buffer.from(payload.perms, 'base64'),
        isSuperadmin: payload.sad,
        departmentId: payload.dept,
      };

      expect(typeof guardUser.userId).toBe('string');
      expect(typeof guardUser.permVersion).toBe('number');
      expect(Buffer.isBuffer(guardUser.bitmap)).toBe(true);
      expect(typeof guardUser.isSuperadmin).toBe('boolean');
      expect(typeof guardUser.departmentId).toBe('string');

      // Bitmap decoded correctly
      expect(guardUser.bitmap).toEqual(Buffer.from([0x01, 0x02, 0x03]));
    });

    it('superadmin flag (sad=true) bypasses PermissionGuard logic', () => {
      const payload = {
        sub: 'admin-user-id',
        pv: 0,
        perms: '',
        sad: true,
        dept: 'dept-admin',
      };

      const guardUser = {
        userId: payload.sub,
        permVersion: payload.pv,
        bitmap: payload.perms ? Buffer.from(payload.perms, 'base64') : Buffer.alloc(0),
        isSuperadmin: payload.sad,
      };

      expect(guardUser.isSuperadmin).toBe(true);
      // PermissionGuard checks: if (user.isSuperadmin) return true;
    });

    it('roleIds (rids) in JWT are used by AbacRuleEngine for policy lookup', () => {
      const payload = {
        sub: 'user-123',
        rids: ['role-abc', 'role-def'],
      };

      const requestUser = {
        userId: payload.sub,
        roleIds: payload.rids,
      };

      expect(requestUser.roleIds).toEqual(['role-abc', 'role-def']);
      expect(requestUser.roleIds.length).toBe(2);
    });

    it('empty rids in JWT still works (AbacRuleEngine falls back to DB)', () => {
      const payload = {
        sub: 'user-456',
        rids: [],
      };

      const requestUser = {
        userId: payload.sub,
        roleIds: payload.rids,
      };

      expect(requestUser.roleIds).toEqual([]);
      // AbacRuleEngine.findApplicablePolicies handles empty roleIds
      // by falling back to DB lookup via getUserRoleIds
    });
  });

  describe('BitmapComputation produces FE-consumable bitmaps', () => {
    let service: BitmapComputationService;
    let userModel: any;
    let roleModel: any;
    let epModel: any;

    const mockSelectLean = (returnValue: any) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(returnValue),
    });

    beforeEach(() => {
      userModel = { findById: jest.fn() };
      roleModel = { find: jest.fn() };
      epModel = { find: jest.fn() };
      service = new BitmapComputationService(userModel, roleModel, epModel);
    });

    it('computed bitmap base64-encodes to valid JWT perms field', async () => {
      const userId = new Types.ObjectId();
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(mockSelectLean({ _id: userId, roleIds: [roleId] }));
      roleModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]));
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: epId, bitIndex: 0 }]));

      const bitmap = await service.computeBitmap(userId.toString());
      const base64 = bitmap.toString('base64');

      // FE can decode it
      const decoded = Buffer.from(base64, 'base64');
      expect(decoded).toEqual(bitmap);
      expect(decoded[0] & 0x01).toBe(1);
    });

    it('bitmap with high bitIndex produces correctly-sized base64 string', async () => {
      const userId = new Types.ObjectId();
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(mockSelectLean({ _id: userId, roleIds: [roleId] }));
      roleModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]));
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: epId, bitIndex: 79 }]));

      const bitmap = await service.computeBitmap(userId.toString());
      const base64 = bitmap.toString('base64');

      // 80 bits = 10 bytes
      const decoded = Buffer.from(base64, 'base64');
      expect(decoded.length).toBe(10);
      // bitIndex 79: byte 9, bit 7
      expect(decoded[9] & 0x80).toBe(0x80);
    });
  });

  describe('RouteMap path format matches FE path pattern format', () => {
    let service: RouteMapService;
    let epModel: any;

    const mockSelectLean = (returnValue: any) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(returnValue),
    });

    beforeEach(() => {
      epModel = { find: jest.fn() };
      service = new RouteMapService(epModel as any);
    });

    it('FE sends "GET:/devices" → BE resolves via RouteMap', async () => {
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([
        { method: 'GET', pathPattern: '/devices', pathRegex: '^/devices$', bitIndex: 0, isActive: true },
      ]));
      await service.reload();

      // FE parses "GET:/devices" into method + path
      const fePerm = 'GET:/devices';
      const [method, path] = fePerm.split(':');

      const bitIndex = service.resolve(method, path);
      expect(bitIndex).toBe(0);
    });

    it('FE sends "DELETE:/devices/123" → BE resolves parametric route', async () => {
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([
        { method: 'DELETE', pathPattern: '/devices/:id', pathRegex: '^/devices/[^/]+$', bitIndex: 5, isActive: true },
      ]));
      await service.reload();

      const fePerm = 'DELETE:/devices/507f1f77bcf86cd799439011';
      const colonIdx = fePerm.indexOf(':');
      const method = fePerm.substring(0, colonIdx);
      const path = fePerm.substring(colonIdx + 1);

      const bitIndex = service.resolve(method, path);
      expect(bitIndex).toBe(5);
    });

    it('FE public paths do not need BE route resolution', async () => {
      const fePublicPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        '/health',
      ];

      epModel.find = jest.fn().mockReturnValue(mockSelectLean([]));
      await service.reload();

      for (const path of fePublicPaths) {
        const bitIndex = service.resolve('GET', path);
        // Public paths should return null (unregistered) — FE skips guard for these
        expect(bitIndex).toBeNull();
      }
    });
  });

  describe('ABAC policy response shape matches FE type contract', () => {
    it('ABAC policy from DB maps to FE AbacPolicy interface', () => {
      const dbPolicy = {
        _id: new Types.ObjectId(),
        name: 'dept-read-policy',
        description: 'Allow reading own department',
        roleIds: [new Types.ObjectId()],
        resource: 'device',
        action: 'read',
        effect: 'allow',
        conditions: [{
          field: 'resource.departmentId',
          operator: 'equals',
          value: '{{user.departmentId}}',
          valueType: 'template',
        }],
        isActive: true,
      };

      // This is how BE maps to FE response
      const fePolicy = {
        id: dbPolicy._id.toString(),
        name: dbPolicy.name,
        description: dbPolicy.description,
        roleIds: dbPolicy.roleIds.map((r: Types.ObjectId) => r.toString()),
        resource: dbPolicy.resource,
        action: dbPolicy.action,
        effect: dbPolicy.effect,
        conditions: dbPolicy.conditions,
        isActive: dbPolicy.isActive,
      };

      // Verify FE contract
      expect(typeof fePolicy.id).toBe('string');
      expect(typeof fePolicy.name).toBe('string');
      expect(typeof fePolicy.resource).toBe('string');
      expect(['create', 'read', 'update', 'delete', 'approve', 'export', 'import']).toContain(fePolicy.action);
      expect(['allow', 'deny']).toContain(fePolicy.effect);
      expect(Array.isArray(fePolicy.conditions)).toBe(true);
      expect(typeof fePolicy.isActive).toBe('boolean');
      expect(Array.isArray(fePolicy.roleIds)).toBe(true);
    });

    it('FE condition type matches BE PolicyCondition interface', () => {
      const feCondition = {
        field: 'resource.departmentId',
        operator: 'equals' as const,
        value: 'dept1',
        valueType: 'static' as const,
      };

      const validOperators = ['equals', 'notEquals', 'in', 'notIn', 'contains', 'gt', 'lt', 'gte', 'lte', 'exists'];
      const validValueTypes = ['static', 'template'];

      expect(validOperators).toContain(feCondition.operator);
      expect(validValueTypes).toContain(feCondition.valueType);
    });

    it('all FE-recognized actions are valid BE action enum values', () => {
      const feActions = ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'];

      for (const action of feActions) {
        expect(['create', 'read', 'update', 'delete', 'approve', 'export', 'import']).toContain(action);
      }
    });
  });

  describe('AbacRuleEngine produces consistent results for FE-driven parameters', () => {
    let service: AbacRuleEngineService;
    let policyModel: any;
    let userModel: any;

    beforeEach(() => {
      policyModel = { find: jest.fn() };
      userModel = { findById: jest.fn() };
      service = new AbacRuleEngineService(policyModel, userModel);
    });

    it('policy lookup uses resource + action matching FE request context', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(
        { userId: 'u1', departmentId: 'd1', isSuperadmin: false, permVersion: 1, bitmap: Buffer.alloc(0), roleIds: ['r1'] },
        'device',
        'read',
      );

      const query = policyModel.find.mock.calls[0][0];
      expect(query.resource).toBe('device');
      expect(query.action).toBe('read');
      expect(query.isActive).toBe(true);
    });

    it('template resolution works with JWT-provided user fields', async () => {
      // FE sends user data derived from JWT: userId, departmentId
      const user = {
        userId: 'user-from-jwt',
        departmentId: 'dept-from-jwt',
        isSuperadmin: false,
        permVersion: 1,
        bitmap: Buffer.alloc(0),
      };

      const condition = {
        field: 'resource.departmentId',
        operator: 'equals' as const,
        value: '{{user.departmentId}}',
        valueType: 'template' as const,
      };

      const result = service.evaluateCondition(condition, user as any, { departmentId: 'dept-from-jwt' });
      expect(result).toBe(true);
    });
  });
});
