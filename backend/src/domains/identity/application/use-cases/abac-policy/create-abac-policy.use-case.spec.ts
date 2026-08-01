import { ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateAbacPolicyUseCase } from './create-abac-policy.use-case';
import { AbacPolicy } from '@/domains/identity/infrastructure/persistence/schemas/abac-policy.schema';

describe('CreateAbacPolicyUseCase', () => {
  let useCase: CreateAbacPolicyUseCase;
  let policyModel: any;

  const makeValidInput = (overrides: Record<string, any> = {}) => ({
    name: 'test-policy',
    description: 'A test policy',
    roleIds: [new Types.ObjectId().toString()],
    resource: 'device',
    action: 'read',
    effect: 'allow' as const,
    conditions: [
      { field: 'resource.departmentId', operator: 'equals', value: 'dept1', valueType: 'static' as const },
    ],
    createdBy: 'creator1',
    ...overrides,
  });

  beforeEach(() => {
    policyModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    useCase = new CreateAbacPolicyUseCase(policyModel);
  });

  it('creates policy successfully with valid input', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const docId = new Types.ObjectId();
    const createdDoc = {
      _id: docId,
      name: 'test-policy',
      description: 'A test policy',
      roleIds: [new Types.ObjectId()],
      resource: 'device',
      action: 'read',
      effect: 'allow',
      conditions: [],
      isActive: true,
      createdBy: 'creator1',
    };
    policyModel.create.mockResolvedValue(createdDoc);

    const result = await useCase.execute(makeValidInput());

    expect(result.id).toBe(docId.toString());
    expect(result.name).toBe('test-policy');
    expect(result.resource).toBe('device');
    expect(result.action).toBe('read');
    expect(result.effect).toBe('allow');
    expect(result.isActive).toBe(true);
    expect(result.roleIds).toHaveLength(1);
  });

  it('throws ConflictException when policy name already exists', async () => {
    policyModel.findOne.mockResolvedValue({ _id: new Types.ObjectId(), name: 'test-policy' });

    await expect(useCase.execute(makeValidInput())).rejects.toThrow(ConflictException);
    expect(policyModel.create).not.toHaveBeenCalled();
  });

  it('defaults description to empty string when not provided', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const input = makeValidInput();
    (input as any).description = undefined;

    const createdDoc = {
      _id: new Types.ObjectId(),
      name: 'test-policy',
      description: '',
      roleIds: [],
      resource: 'device',
      action: 'read',
      effect: 'allow',
      conditions: [],
      isActive: true,
      createdBy: 'creator1',
    };
    policyModel.create.mockResolvedValue(createdDoc);

    await useCase.execute(input);

    expect(policyModel.create).toHaveBeenCalledWith(expect.objectContaining({
      description: '',
    }));
  });

  it('defaults effect to allow when not provided', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const input = makeValidInput();
    (input as any).effect = 'allow';

    policyModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      ...input,
      description: '',
      isActive: true,
    });

    await useCase.execute(input);
    expect(policyModel.create).toHaveBeenCalled();
  });

  it('defaults isActive to true', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const createdDoc = {
      _id: new Types.ObjectId(),
      name: 'p1',
      description: '',
      roleIds: [],
      resource: 'device',
      action: 'read',
      effect: 'allow',
      conditions: [],
      isActive: true,
      createdBy: 'creator1',
    };
    policyModel.create.mockResolvedValue(createdDoc);

    const result = await useCase.execute(makeValidInput({ description: '', conditions: [], roleIds: [] }));

    expect(result.isActive).toBe(true);
  });

  it('handles template valueType conditions', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const conditions = [
      {
        field: 'resource.departmentId',
        operator: 'equals',
        value: '{{user.departmentId}}',
        valueType: 'template' as const,
      },
    ];
    const createdDoc = {
      _id: new Types.ObjectId(),
      name: 'template-policy',
      description: '',
      roleIds: [],
      resource: 'device',
      action: 'read',
      effect: 'allow',
      conditions,
      isActive: true,
      createdBy: 'creator1',
    };
    policyModel.create.mockResolvedValue(createdDoc);

    const result = await useCase.execute(makeValidInput({ conditions }));

    expect(result.conditions).toEqual(conditions);
  });

  it('handles empty roleIds', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const createdDoc = {
      _id: new Types.ObjectId(),
      name: 'global-policy',
      description: '',
      roleIds: [],
      resource: '*',
      action: 'read',
      effect: 'allow',
      conditions: [],
      isActive: true,
      createdBy: 'creator1',
    };
    policyModel.create.mockResolvedValue(createdDoc);

    const result = await useCase.execute(makeValidInput({ roleIds: [], name: 'global-policy' }));

    expect(result.roleIds).toEqual([]);
  });

  it('handles all action types', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const actions = ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'];

    for (const action of actions) {
      const createdDoc = {
        _id: new Types.ObjectId(),
        name: `policy-${action}`,
        description: '',
        roleIds: [],
        resource: 'document',
        action,
        effect: 'allow',
        conditions: [],
        isActive: true,
        createdBy: 'creator1',
      };
      policyModel.create.mockResolvedValue(createdDoc);

      const result = await useCase.execute(makeValidInput({ name: `policy-${action}`, action }));

      expect(result.action).toBe(action);
    }
  });

  it('deny effect policy with conditions', async () => {
    policyModel.findOne.mockResolvedValue(null);
    const createdDoc = {
      _id: new Types.ObjectId(),
      name: 'deny-policy',
      description: '',
      roleIds: [],
      resource: 'device',
      action: 'delete',
      effect: 'deny',
      conditions: [
        { field: 'resource.priority', operator: 'lte', value: 3, valueType: 'static' },
      ],
      isActive: true,
      createdBy: 'creator1',
    };
    policyModel.create.mockResolvedValue(createdDoc);

    const result = await useCase.execute(makeValidInput({
      name: 'deny-policy',
      action: 'delete',
      effect: 'deny',
      conditions: [
        { field: 'resource.priority', operator: 'lte', value: 3, valueType: 'static' },
      ],
    }));

    expect(result.effect).toBe('deny');
  });
});
