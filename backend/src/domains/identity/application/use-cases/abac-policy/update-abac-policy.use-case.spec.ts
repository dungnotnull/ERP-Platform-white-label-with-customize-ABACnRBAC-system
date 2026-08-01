import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdateAbacPolicyUseCase } from './update-abac-policy.use-case';

describe('UpdateAbacPolicyUseCase', () => {
  let useCase: UpdateAbacPolicyUseCase;
  let policyModel: any;

  const makeDoc = (overrides: Record<string, any> = {}) => ({
    _id: new Types.ObjectId(),
    name: 'test-policy',
    description: 'original desc',
    roleIds: [new Types.ObjectId()],
    resource: 'device',
    action: 'read',
    effect: 'allow',
    conditions: [{ field: 'resource.x', operator: 'equals', value: 'y', valueType: 'static' }],
    isActive: true,
    createdBy: new Types.ObjectId(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  beforeEach(() => {
    policyModel = {
      findById: jest.fn(),
    };
    useCase = new UpdateAbacPolicyUseCase(policyModel);
  });

  it('throws NotFoundException when policy not found', async () => {
    policyModel.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(NotFoundException);
  });

  it('updates description only', async () => {
    const doc = makeDoc();
    policyModel.findById.mockResolvedValue(doc);

    const result = await useCase.execute({ id: doc._id.toString(), description: 'new desc' });

    expect(doc.description).toBe('new desc');
    expect(doc.save).toHaveBeenCalled();
    expect(result.description).toBe('new desc');
  });

  it('updates roleIds only', async () => {
    const doc = makeDoc();
    policyModel.findById.mockResolvedValue(doc);
    const newRoles = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];

    const result = await useCase.execute({ id: doc._id.toString(), roleIds: newRoles });

    expect(doc.roleIds).toEqual(newRoles);
    expect(doc.save).toHaveBeenCalled();
    expect(result.roleIds).toEqual(newRoles);
  });

  it('updates effect only', async () => {
    const doc = makeDoc({ effect: 'allow' });
    policyModel.findById.mockResolvedValue(doc);

    const result = await useCase.execute({ id: doc._id.toString(), effect: 'deny' });

    expect(doc.effect).toBe('deny');
    expect(doc.save).toHaveBeenCalled();
    expect(result.effect).toBe('deny');
  });

  it('updates conditions only', async () => {
    const doc = makeDoc();
    policyModel.findById.mockResolvedValue(doc);
    const newConditions = [
      { field: 'resource.priority', operator: 'gt', value: 5, valueType: 'static' },
    ];

    const result = await useCase.execute({ id: doc._id.toString(), conditions: newConditions as any });

    expect(doc.conditions).toEqual(newConditions);
    expect(doc.save).toHaveBeenCalled();
    expect(result.conditions).toEqual(newConditions);
  });

  it('toggles isActive', async () => {
    const doc = makeDoc({ isActive: true });
    policyModel.findById.mockResolvedValue(doc);

    const result = await useCase.execute({ id: doc._id.toString(), isActive: false });

    expect(doc.isActive).toBe(false);
    expect(doc.save).toHaveBeenCalled();
    expect(result.isActive).toBe(false);
  });

  it('updates multiple fields at once', async () => {
    const doc = makeDoc();
    policyModel.findById.mockResolvedValue(doc);

    const result = await useCase.execute({
      id: doc._id.toString(),
      description: 'multi-update',
      effect: 'deny',
      isActive: false,
    });

    expect(doc.description).toBe('multi-update');
    expect(doc.effect).toBe('deny');
    expect(doc.isActive).toBe(false);
    expect(doc.save).toHaveBeenCalledTimes(1);
    expect(result.description).toBe('multi-update');
    expect(result.effect).toBe('deny');
    expect(result.isActive).toBe(false);
  });

  it('does NOT update name (immutable)', async () => {
    const doc = makeDoc({ name: 'original-name' });
    policyModel.findById.mockResolvedValue(doc);

    await useCase.execute({ id: doc._id.toString(), description: 'something' });

    expect(doc.name).toBe('original-name');
  });

  it('does not modify fields when input values are undefined', async () => {
    const doc = makeDoc({ description: 'keep-me', roleIds: [new Types.ObjectId()], effect: 'allow' });
    policyModel.findById.mockResolvedValue(doc);

    await useCase.execute({ id: doc._id.toString() });

    expect(doc.description).toBe('keep-me');
  });
});
