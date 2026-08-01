import { Types } from 'mongoose';
import { AbacRuleEngineService } from './abac-rule-engine.service';
import { RequestUser } from '@/domains/identity/presentation/policies/policy-handler.interface';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  userId: 'user1',
  departmentId: 'dept1',
  isSuperadmin: false,
  permVersion: 1,
  bitmap: Buffer.alloc(0),
  ...overrides,
});

const makeCondition = (overrides: Record<string, any> = {}) => ({
  field: 'resource.departmentId',
  operator: 'equals' as const,
  value: 'dept1',
  valueType: 'static' as const,
  ...overrides,
});

const makePolicyDoc = (overrides: Record<string, any> = {}) => ({
  _id: new Types.ObjectId(),
  name: 'test-policy',
  description: '',
  roleIds: [] as Types.ObjectId[],
  resource: 'device',
  action: 'read',
  effect: 'allow' as const,
  conditions: [] as any[],
  isActive: true,
  createdBy: new Types.ObjectId(),
  ...overrides,
  toObject: jest.fn().mockReturnThis(),
});

describe('AbacRuleEngineService', () => {
  let service: AbacRuleEngineService;
  let policyModel: any;
  let userModel: any;

  beforeEach(() => {
    policyModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };
    userModel = {
      findById: jest.fn(),
    };

    service = new AbacRuleEngineService(policyModel, userModel);
  });

  // =========================================================================
  // findApplicablePolicies
  // =========================================================================
  describe('findApplicablePolicies', () => {
    it('returns policies matching resource + action + isActive:true', async () => {
      const user = makeUser({ roleIds: ['role1'] });
      const mockLean = jest.fn().mockResolvedValue([makePolicyDoc()]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(user, 'device', 'read');

      const query = policyModel.find.mock.calls[0][0];
      expect(query.resource).toBe('device');
      expect(query.action).toBe('read');
      expect(query.isActive).toBe(true);
    });

    it('filters by user roleIds from RequestUser', async () => {
      const user = makeUser({ roleIds: ['role1', 'role2'] });
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(user, 'device', 'read');

      const query = policyModel.find.mock.calls[0][0];
      expect(query.$or).toBeDefined();
      expect(query.$or[0].roleIds.$in).toEqual(['role1', 'role2']);
    });

    it('includes policies with empty roleIds array (global policies) via $size:0', async () => {
      const user = makeUser({ roleIds: ['role1'] });
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(user, 'device', 'read');

      const query = policyModel.find.mock.calls[0][0];
      expect(query.$or[1].roleIds.$size).toBe(0);
    });

    it('returns empty array when no matching policies', async () => {
      const user = makeUser({ roleIds: ['role1'] });
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.findApplicablePolicies(user, 'unknown', 'export');

      expect(result).toEqual([]);
    });

    it('falls back to DB lookup when user.roleIds is undefined', async () => {
      const user = makeUser();
      delete user.roleIds;
      const mockSelectLean = jest.fn().mockResolvedValue({ roleIds: [new Types.ObjectId('111111111111111111111111')] });
      userModel.findById = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: mockSelectLean }) });
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(user, 'device', 'read');

      expect(userModel.findById).toHaveBeenCalledWith('user1');
      const query = policyModel.find.mock.calls[0][0];
      expect(query.$or[0].roleIds.$in).toEqual(['111111111111111111111111']);
    });

    it('falls back to DB lookup when user.roleIds is empty array', async () => {
      const user = makeUser({ roleIds: [] });
      const mockSelectLean = jest.fn().mockResolvedValue({ roleIds: [new Types.ObjectId('222222222222222222222222')] });
      userModel.findById = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: mockSelectLean }) });
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(user, 'device', 'read');

      expect(userModel.findById).toHaveBeenCalledWith('user1');
    });

    it('handles user not found during role lookup fallback (returns empty array)', async () => {
      const user = makeUser();
      delete user.roleIds;
      const mockSelectLean = jest.fn().mockResolvedValue(null);
      userModel.findById = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: mockSelectLean }) });
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      await service.findApplicablePolicies(user, 'device', 'read');

      const query = policyModel.find.mock.calls[0][0];
      expect(query.$or[0].roleIds.$in).toEqual([]);
    });
  });

  // =========================================================================
  // evaluateCondition — equals / notEquals
  // =========================================================================
  describe('evaluateCondition - equals', () => {
    it('returns true when string values match', () => {
      const cond = makeCondition({ field: 'resource.departmentId', operator: 'equals', value: 'dept1' });
      expect(service.evaluateCondition(cond, makeUser(), { departmentId: 'dept1' })).toBe(true);
    });

    it('returns true when coerceable values match (number vs string)', () => {
      const cond = makeCondition({ field: 'resource.count', operator: 'equals', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { count: '5' })).toBe(true);
    });

    it('returns false when values differ', () => {
      const cond = makeCondition({ field: 'resource.departmentId', operator: 'equals', value: 'dept2' });
      expect(service.evaluateCondition(cond, makeUser(), { departmentId: 'dept1' })).toBe(false);
    });

    it('handles null field value with string coercion', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'equals', value: null });
      expect(service.evaluateCondition(cond, makeUser(), { name: null })).toBe(true);
    });

    it('handles undefined field value with string coercion', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'equals', value: undefined });
      expect(service.evaluateCondition(cond, makeUser(), { name: undefined })).toBe(true);
    });
  });

  describe('evaluateCondition - notEquals', () => {
    it('returns true when values differ', () => {
      const cond = makeCondition({ field: 'resource.departmentId', operator: 'notEquals', value: 'dept2' });
      expect(service.evaluateCondition(cond, makeUser(), { departmentId: 'dept1' })).toBe(true);
    });

    it('returns false when values match', () => {
      const cond = makeCondition({ field: 'resource.departmentId', operator: 'notEquals', value: 'dept1' });
      expect(service.evaluateCondition(cond, makeUser(), { departmentId: 'dept1' })).toBe(false);
    });

    it('handles type coercion (5 vs "5")', () => {
      const cond = makeCondition({ field: 'resource.count', operator: 'notEquals', value: '5' });
      expect(service.evaluateCondition(cond, makeUser(), { count: 5 })).toBe(false);
    });
  });

  // =========================================================================
  // evaluateCondition — in / notIn
  // =========================================================================
  describe('evaluateCondition - in', () => {
    it('returns true when fieldValue is in resolvedValue array', () => {
      const cond = makeCondition({ field: 'resource.type', operator: 'in', value: ['laptop', 'phone', 'tablet'] });
      expect(service.evaluateCondition(cond, makeUser(), { type: 'phone' })).toBe(true);
    });

    it('returns false when fieldValue not in array', () => {
      const cond = makeCondition({ field: 'resource.type', operator: 'in', value: ['desktop', 'server'] });
      expect(service.evaluateCondition(cond, makeUser(), { type: 'phone' })).toBe(false);
    });

    it('returns false when resolvedValue is not an array', () => {
      const cond = makeCondition({ field: 'resource.type', operator: 'in', value: 'not-array' });
      expect(service.evaluateCondition(cond, makeUser(), { type: 'phone' })).toBe(false);
    });

    it('matches with type coercion (number vs string)', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'in', value: [1, 2, 3] });
      expect(service.evaluateCondition(cond, makeUser(), { priority: '2' })).toBe(true);
    });
  });

  describe('evaluateCondition - notIn', () => {
    it('returns true when fieldValue not in array', () => {
      const cond = makeCondition({ field: 'resource.type', operator: 'notIn', value: ['desktop', 'server'] });
      expect(service.evaluateCondition(cond, makeUser(), { type: 'phone' })).toBe(true);
    });

    it('returns false when fieldValue is in array', () => {
      const cond = makeCondition({ field: 'resource.type', operator: 'notIn', value: ['laptop', 'phone'] });
      expect(service.evaluateCondition(cond, makeUser(), { type: 'phone' })).toBe(false);
    });

    it('returns false when resolvedValue is not an array', () => {
      const cond = makeCondition({ field: 'resource.type', operator: 'notIn', value: 'not-array' });
      expect(service.evaluateCondition(cond, makeUser(), { type: 'phone' })).toBe(false);
    });
  });

  // =========================================================================
  // evaluateCondition — contains
  // =========================================================================
  describe('evaluateCondition - contains', () => {
    it('returns true when field contains substring', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'contains', value: 'server' });
      expect(service.evaluateCondition(cond, makeUser(), { name: 'web-server-01' })).toBe(true);
    });

    it('returns false when field does not contain substring', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'contains', value: 'db' });
      expect(service.evaluateCondition(cond, makeUser(), { name: 'web-server-01' })).toBe(false);
    });

    it('handles null field value without crashing', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'contains', value: 'test' });
      expect(service.evaluateCondition(cond, makeUser(), { name: null })).toBe(false);
    });

    it('handles undefined field value without crashing', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'contains', value: 'test' });
      expect(service.evaluateCondition(cond, makeUser(), { name: undefined })).toBe(false);
    });
  });

  // =========================================================================
  // evaluateCondition — gt / lt / gte / lte
  // =========================================================================
  describe('evaluateCondition - gt', () => {
    it('returns true when Number(field) > Number(value)', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'gt', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 10 })).toBe(true);
    });

    it('returns false when equal', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'gt', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 5 })).toBe(false);
    });

    it('returns false when less', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'gt', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 3 })).toBe(false);
    });
  });

  describe('evaluateCondition - lt', () => {
    it('returns true when less', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'lt', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 3 })).toBe(true);
    });

    it('returns false when greater', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'lt', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 10 })).toBe(false);
    });
  });

  describe('evaluateCondition - gte', () => {
    it('returns true when greater', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'gte', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 10 })).toBe(true);
    });

    it('returns true when equal', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'gte', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 5 })).toBe(true);
    });

    it('returns false when less', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'gte', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 3 })).toBe(false);
    });
  });

  describe('evaluateCondition - lte', () => {
    it('returns true when less', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'lte', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 3 })).toBe(true);
    });

    it('returns true when equal', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'lte', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 5 })).toBe(true);
    });

    it('returns false when greater', () => {
      const cond = makeCondition({ field: 'resource.priority', operator: 'lte', value: 5 });
      expect(service.evaluateCondition(cond, makeUser(), { priority: 10 })).toBe(false);
    });
  });

  // =========================================================================
  // evaluateCondition — exists
  // =========================================================================
  describe('evaluateCondition - exists', () => {
    it('returns true when field is non-null and defined', () => {
      const cond = makeCondition({ field: 'resource.tag', operator: 'exists', value: true });
      expect(service.evaluateCondition(cond, makeUser(), { tag: 'critical' })).toBe(true);
    });

    it('returns true when field is zero (falsy but not null/undefined)', () => {
      const cond = makeCondition({ field: 'resource.count', operator: 'exists', value: true });
      expect(service.evaluateCondition(cond, makeUser(), { count: 0 })).toBe(true);
    });

    it('returns true when field is empty string', () => {
      const cond = makeCondition({ field: 'resource.name', operator: 'exists', value: true });
      expect(service.evaluateCondition(cond, makeUser(), { name: '' })).toBe(true);
    });

    it('returns false when field is null', () => {
      const cond = makeCondition({ field: 'resource.tag', operator: 'exists', value: true });
      expect(service.evaluateCondition(cond, makeUser(), { tag: null })).toBe(false);
    });

    it('returns false when field is undefined (key missing)', () => {
      const cond = makeCondition({ field: 'resource.tag', operator: 'exists', value: true });
      expect(service.evaluateCondition(cond, makeUser(), {})).toBe(false);
    });
  });

  // =========================================================================
  // evaluateCondition — unknown operator
  // =========================================================================
  describe('evaluateCondition - unknown operator', () => {
    it('returns false for unknown operator', () => {
      const cond = makeCondition({ operator: 'unknownOperator' as any });
      expect(service.evaluateCondition(cond, makeUser(), { departmentId: 'dept1' })).toBe(false);
    });
  });

  // =========================================================================
  // Template value resolution
  // =========================================================================
  describe('template value resolution', () => {
    it('resolves {{user.departmentId}} from user object', () => {
      const user = makeUser({ departmentId: 'dept-sales' });
      const cond = makeCondition({ value: '{{user.departmentId}}', valueType: 'template' });
      expect(service.evaluateCondition(cond, user, { departmentId: 'dept-sales' })).toBe(true);
    });

    it('resolves {{user.userId}} from user object', () => {
      const user = makeUser({ userId: 'abc123' });
      const cond = makeCondition({
        field: 'user.userId',
        operator: 'equals',
        value: '{{user.userId}}',
        valueType: 'template',
      });
      // Note: field resolves to user.userId which is abc123, template also resolves to abc123
      expect(service.evaluateCondition(cond, user, {})).toBe(true);
    });

    it('resolves {{resource.createdBy}} from resource object', () => {
      const user = makeUser({ userId: 'owner456' });
      const cond = makeCondition({
        field: 'resource.createdBy',
        operator: 'equals',
        value: '{{user.userId}}',
        valueType: 'template',
      });
      expect(service.evaluateCondition(cond, user, { createdBy: 'owner456' })).toBe(true);
    });

    it('resolves {{resource.departmentId}} from resource object', () => {
      const user = makeUser({ departmentId: 'dept-x' });
      const cond = makeCondition({
        field: 'resource.departmentId',
        operator: 'equals',
        value: '{{user.departmentId}}',
        valueType: 'template',
      });
      expect(service.evaluateCondition(cond, user, { departmentId: 'dept-x' })).toBe(true);
    });

    it('returns empty string for unresolvable template path', () => {
      const user = makeUser();
      const cond = makeCondition({
        field: 'resource.name',
        operator: 'equals',
        value: '{{resource.nonexistent}}',
        valueType: 'template',
      });
      expect(service.evaluateCondition(cond, user, { name: '' })).toBe(true);
    });

    it('resolves mixed template + static content', () => {
      const user = makeUser({ departmentId: 'dept1' });
      const cond = makeCondition({
        field: 'resource.name',
        operator: 'equals',
        value: 'report-{{user.departmentId}}.pdf',
        valueType: 'template',
      });
      expect(service.evaluateCondition(cond, user, { name: 'report-dept1.pdf' })).toBe(true);
    });

    it('resolves multiple templates in one value string', () => {
      const user = makeUser({ userId: 'u1', departmentId: 'dept-a' });
      const cond = makeCondition({
        field: 'resource.path',
        operator: 'equals',
        value: '/{{user.departmentId}}/{{user.userId}}',
        valueType: 'template',
      });
      expect(service.evaluateCondition(cond, user, { path: '/dept-a/u1' })).toBe(true);
    });

    it('does NOT process template when valueType is static', () => {
      const user = makeUser({ departmentId: 'dept1' });
      const cond = makeCondition({
        field: 'resource.name',
        operator: 'equals',
        value: '{{user.departmentId}}',
        valueType: 'static',
      });
      expect(service.evaluateCondition(cond, user, { name: '{{user.departmentId}}' })).toBe(true);
    });

    it('handles template with whitespace in path (trimmed)', () => {
      const user = makeUser({ departmentId: 'dept-a' });
      const cond = makeCondition({
        field: 'resource.name',
        operator: 'equals',
        value: '{{ user.departmentId }}',
        valueType: 'template',
      });
      expect(service.evaluateCondition(cond, user, { name: 'dept-a' })).toBe(true);
    });
  });

  // =========================================================================
  // resolvePath edge cases
  // =========================================================================
  describe('resolvePath edge cases', () => {
    it('returns undefined for path that does not start with user. or resource.', () => {
      const cond = makeCondition({ field: 'unknown.field', operator: 'exists', value: true });
      expect(service.evaluateCondition(cond, makeUser(), { field: 'value' })).toBe(false);
    });

    it('returns undefined for nested path where intermediate is null', () => {
      const user = makeUser();
      const cond = makeCondition({
        field: 'resource.meta.level',
        operator: 'exists',
        value: true,
      });
      expect(service.evaluateCondition(cond, user, { meta: null })).toBe(false);
    });

    it('handles deeply nested resource path', () => {
      const cond = makeCondition({
        field: 'resource.config.settings.region',
        operator: 'equals',
        value: 'us-east',
      });
      expect(service.evaluateCondition(cond, makeUser(), {
        config: { settings: { region: 'us-east' } },
      })).toBe(true);
    });
  });

  // =========================================================================
  // evaluateAll
  // =========================================================================
  describe('evaluateAll', () => {
    it('returns true for empty conditions array', () => {
      expect(service.evaluateAll([], makeUser(), {})).toBe(true);
    });

    it('returns true when all conditions pass', () => {
      const conditions = [
        makeCondition({ field: 'resource.a', operator: 'equals', value: 'x' }),
        makeCondition({ field: 'resource.b', operator: 'equals', value: 'y' }),
      ];
      expect(service.evaluateAll(conditions, makeUser(), { a: 'x', b: 'y' })).toBe(true);
    });

    it('returns false when any condition fails', () => {
      const conditions = [
        makeCondition({ field: 'resource.a', operator: 'equals', value: 'x' }),
        makeCondition({ field: 'resource.b', operator: 'equals', value: 'z' }),
      ];
      expect(service.evaluateAll(conditions, makeUser(), { a: 'x', b: 'y' })).toBe(false);
    });
  });

  // =========================================================================
  // evaluateAny
  // =========================================================================
  describe('evaluateAny', () => {
    it('returns true for empty conditions array', () => {
      expect(service.evaluateAny([], makeUser(), {})).toBe(true);
    });

    it('returns true when any condition passes', () => {
      const conditions = [
        makeCondition({ field: 'resource.a', operator: 'equals', value: 'no' }),
        makeCondition({ field: 'resource.b', operator: 'equals', value: 'yes' }),
      ];
      expect(service.evaluateAny(conditions, makeUser(), { a: 'no', b: 'yes' })).toBe(true);
    });

    it('returns false when all conditions fail', () => {
      const conditions = [
        makeCondition({ field: 'resource.a', operator: 'equals', value: 'no' }),
        makeCondition({ field: 'resource.b', operator: 'equals', value: 'no' }),
      ];
      expect(service.evaluateAny(conditions, makeUser(), { a: 'x', b: 'y' })).toBe(false);
    });

    it('returns true when first condition passes (short-circuit)', () => {
      const conditions = [
        makeCondition({ field: 'resource.a', operator: 'equals', value: 'yes' }),
        makeCondition({ field: 'resource.b', operator: 'equals', value: 'no' }),
      ];
      expect(service.evaluateAny(conditions, makeUser(), { a: 'yes', b: 'no' })).toBe(true);
    });
  });

  // =========================================================================
  // evaluatePolicy
  // =========================================================================
  describe('evaluatePolicy', () => {
    it('returns true for allow policy with matching conditions', async () => {
      const policy = makePolicyDoc({
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const result = await service.evaluatePolicy(policy as any, makeUser(), { x: 'yes' });
      expect(result).toBe(true);
    });

    it('returns false for allow policy with non-matching conditions', async () => {
      const policy = makePolicyDoc({
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const result = await service.evaluatePolicy(policy as any, makeUser(), { x: 'no' });
      expect(result).toBe(false);
    });

    it('returns false for deny policy with matching conditions (inverted result)', async () => {
      const policy = makePolicyDoc({
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const result = await service.evaluatePolicy(policy as any, makeUser(), { x: 'yes' });
      expect(result).toBe(false);
    });

    it('returns true for deny policy with non-matching conditions (inverted result)', async () => {
      const policy = makePolicyDoc({
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const result = await service.evaluatePolicy(policy as any, makeUser(), { x: 'no' });
      expect(result).toBe(true);
    });

    it('returns true for allow policy with empty conditions', async () => {
      const policy = makePolicyDoc({ effect: 'allow', conditions: [] });
      const result = await service.evaluatePolicy(policy as any, makeUser(), {});
      expect(result).toBe(true);
    });

    it('returns false for deny policy with empty conditions (always blocks)', async () => {
      const policy = makePolicyDoc({ effect: 'deny', conditions: [] });
      const result = await service.evaluatePolicy(policy as any, makeUser(), {});
      expect(result).toBe(false);
    });

    it('returns false for unknown effect', async () => {
      const policy = makePolicyDoc({ effect: 'unknown' as any, conditions: [] });
      const result = await service.evaluatePolicy(policy as any, makeUser(), {});
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // evaluateResourceAccess
  // =========================================================================
  describe('evaluateResourceAccess', () => {
    it('returns true when no applicable policies found (defaults to allow)', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'export',
        { id: 'd1' },
      );
      expect(result).toBe(true);
    });

    it('returns true when an allow policy matches', async () => {
      const policy = makePolicyDoc({
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const mockLean = jest.fn().mockResolvedValue([policy]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { x: 'yes' },
      );
      expect(result).toBe(true);
    });

    it('returns false when only deny policies exist and conditions match', async () => {
      const policy = makePolicyDoc({ effect: 'deny', conditions: [] });
      const mockLean = jest.fn().mockResolvedValue([policy]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { x: 'yes' },
      );
      expect(result).toBe(false);
    });

    it('deny policy overrides allow (deny checked first)', async () => {
      const denyPolicy = makePolicyDoc({
        _id: new Types.ObjectId('111111111111111111111111'),
        name: 'deny-all',
        effect: 'deny',
        conditions: [],
      });
      const allowPolicy = makePolicyDoc({
        _id: new Types.ObjectId('222222222222222222222222'),
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([denyPolicy, allowPolicy]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { x: 'yes' },
      );
      expect(result).toBe(false);
    });

    it('allow policies are evaluated in order (first matching allow wins)', async () => {
      const allowPolicy1 = makePolicyDoc({
        _id: new Types.ObjectId(),
        name: 'allow-specific',
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const allowPolicy2 = makePolicyDoc({
        _id: new Types.ObjectId(),
        name: 'allow-general',
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([allowPolicy1, allowPolicy2]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { x: 'yes' },
      );
      expect(result).toBe(true);
    });

    it('returns false when no allow policy matches and no deny blocks', async () => {
      const allowPolicy = makePolicyDoc({
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'no' })],
      });
      const mockLean = jest.fn().mockResolvedValue([allowPolicy]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { x: 'yes' },
      );
      expect(result).toBe(false);
    });

    // =========================================================================
    // Deny/Allow ordering edge cases
    // =========================================================================

    it('multiple deny policies: first deny with matching conditions blocks immediately', async () => {
      const deny1 = makePolicyDoc({
        name: 'deny-priority-low',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.priority', operator: 'lt', value: 3 })],
      });
      const deny2 = makePolicyDoc({
        name: 'deny-priority-high',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.priority', operator: 'gt', value: 8 })],
      });
      const allow = makePolicyDoc({
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([deny1, deny2, allow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // priority = 2 matches deny1 conditions → deny
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { priority: 2 },
      );
      expect(result).toBe(false);
    });

    it('deny policy after allow still blocks (deny comes first in array)', async () => {
      const deny = makePolicyDoc({
        name: 'deny-deleted',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.isDeleted', operator: 'equals', value: true })],
      });
      const allow = makePolicyDoc({
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([deny, allow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { isDeleted: true },
      );
      expect(result).toBe(false);
    });

    it('allow before deny in array: allow wins when deny conditions do not match', async () => {
      const allow = makePolicyDoc({
        name: 'allow-same-dept',
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.departmentId', operator: 'equals', value: '{{user.departmentId}}', valueType: 'template' })],
      });
      const deny = makePolicyDoc({
        name: 'deny-archived',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.isArchived', operator: 'equals', value: true })],
      });
      const mockLean = jest.fn().mockResolvedValue([allow, deny]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const user = makeUser({ roleIds: ['r1'], departmentId: 'dept1' });
      // Same department, not archived → allow matches first
      const result = await service.evaluateResourceAccess(
        user, 'device', 'read',
        { departmentId: 'dept1', isArchived: false },
      );
      expect(result).toBe(true);
    });

    it('deny evaluated before allow: deny blocks even if allow would match', async () => {
      const deny = makePolicyDoc({
        name: 'deny-all',
        effect: 'deny',
        conditions: [],
      });
      const allow = makePolicyDoc({
        name: 'allow-specific',
        effect: 'allow',
        conditions: [makeCondition({ field: 'resource.x', operator: 'equals', value: 'yes' })],
      });
      const mockLean = jest.fn().mockResolvedValue([deny, allow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // deny has empty conditions → matches everything → blocks
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { x: 'yes' },
      );
      expect(result).toBe(false);
    });

    it('deny with non-matching conditions does not block, allow grants access', async () => {
      const deny = makePolicyDoc({
        name: 'deny-foreign',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.departmentId', operator: 'equals', value: 'dept-foreign' })],
      });
      const allow = makePolicyDoc({
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([deny, allow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // deny conditions don't match (dept1 != dept-foreign) → deny evaluates to true (inverted for deny effect = !true = false = not blocked)
      // then allow matches → grants
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { departmentId: 'dept1' },
      );
      expect(result).toBe(true);
    });

    it('role-scoped policies: only policies matching user roles are applied', async () => {
      const roleScopedDeny = makePolicyDoc({
        name: 'deny-manager-delete',
        roleIds: [new Types.ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa')],
        effect: 'deny',
        conditions: [],
      });
      const globalAllow = makePolicyDoc({
        name: 'allow-read',
        roleIds: [],
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([roleScopedDeny, globalAllow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // User has matching role → deny applies → blocked
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'] }),
        'device',
        'delete',
        {},
      );
      expect(result).toBe(false);
    });

    it('global allow grants access when no role-scoped policies apply', async () => {
      // Only global allow is returned (empty roleIds = applicable to all)
      const globalAllow = makePolicyDoc({
        name: 'allow-all',
        roleIds: [],
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([globalAllow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // No role-specific deny applies because findApplicablePolicies filters by role
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['cccccccccccccccccccccccc'] }),
        'device',
        'read',
        {},
      );
      expect(result).toBe(true);
    });

    it('complex nested resource path in conditions with template values', async () => {
      const policy = makePolicyDoc({
        name: 'allow-same-region',
        effect: 'allow',
        conditions: [
          makeCondition({
            field: 'resource.location.region',
            operator: 'equals',
            value: '{{user.region}}',
            valueType: 'template',
          }),
        ],
      });
      const mockLean = jest.fn().mockResolvedValue([policy]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const user = makeUser({ roleIds: ['r1'], region: 'us-east' } as any);
      const result = await service.evaluateResourceAccess(
        user, 'device', 'read',
        { location: { region: 'us-east' } },
      );
      expect(result).toBe(true);
    });

    it('multiple conditions must all pass (AND logic) for allow', async () => {
      const policy = makePolicyDoc({
        name: 'allow-specific',
        effect: 'allow',
        conditions: [
          makeCondition({ field: 'resource.departmentId', operator: 'equals', value: '{{user.departmentId}}', valueType: 'template' }),
          makeCondition({ field: 'resource.isActive', operator: 'equals', value: true }),
          makeCondition({ field: 'resource.priority', operator: 'gte', value: 5 }),
        ],
      });
      const mockLean = jest.fn().mockResolvedValue([policy]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const user = makeUser({ roleIds: ['r1'], departmentId: 'dept1' });

      // All conditions pass
      const allowed = await service.evaluateResourceAccess(
        user, 'device', 'read',
        { departmentId: 'dept1', isActive: true, priority: 7 },
      );
      expect(allowed).toBe(true);

      // One condition fails (priority too low)
      const blocked = await service.evaluateResourceAccess(
        user, 'device', 'read',
        { departmentId: 'dept1', isActive: true, priority: 3 },
      );
      expect(blocked).toBe(false);
    });

    it('deny with complex conditions: only blocks when ALL conditions match', async () => {
      const deny = makePolicyDoc({
        name: 'deny-low-priority-archived',
        effect: 'deny',
        conditions: [
          makeCondition({ field: 'resource.priority', operator: 'lt', value: 3 }),
          makeCondition({ field: 'resource.isArchived', operator: 'equals', value: true }),
        ],
      });
      const allow = makePolicyDoc({
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const mockLean = jest.fn().mockResolvedValue([deny, allow]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // Low priority but NOT archived → deny conditions don't all match → deny inverted to true → not blocked → allow wins
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { priority: 1, isArchived: false },
      );
      expect(result).toBe(true);
    });

    it('inactive policy is not returned by findApplicablePolicies', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        {},
      );
      // No active policies → default allow (RBAC already passed)
      expect(result).toBe(true);

      const query = policyModel.find.mock.calls[0][0];
      expect(query.isActive).toBe(true);
    });

    it('deny AFTER allow in array still blocks (deny-first two-pass)', async () => {
      const allow = makePolicyDoc({
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const deny = makePolicyDoc({
        name: 'deny-sensitive',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.classified', operator: 'equals', value: true })],
      });
      const mockLean = jest.fn().mockResolvedValue([allow, deny]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // allow comes first in array, but deny should still block classified resources
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { classified: true },
      );
      expect(result).toBe(false);
    });

    it('deny AFTER allow: non-classified resource is allowed', async () => {
      const allow = makePolicyDoc({
        name: 'allow-all',
        effect: 'allow',
        conditions: [],
      });
      const deny = makePolicyDoc({
        name: 'deny-sensitive',
        effect: 'deny',
        conditions: [makeCondition({ field: 'resource.classified', operator: 'equals', value: true })],
      });
      const mockLean = jest.fn().mockResolvedValue([allow, deny]);
      policyModel.find = jest.fn().mockReturnValue({ lean: mockLean });

      // Not classified → deny conditions don't match → allow grants
      const result = await service.evaluateResourceAccess(
        makeUser({ roleIds: ['r1'] }),
        'device',
        'read',
        { classified: false },
      );
      expect(result).toBe(true);
    });
  });
});
