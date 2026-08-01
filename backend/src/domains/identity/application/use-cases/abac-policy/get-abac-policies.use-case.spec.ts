import { Types } from 'mongoose';
import { GetAbacPoliciesUseCase } from './get-abac-policies.use-case';

describe('GetAbacPoliciesUseCase', () => {
  let useCase: GetAbacPoliciesUseCase;
  let policyModel: any;

  beforeEach(() => {
    policyModel = {
      find: jest.fn(),
    };
    useCase = new GetAbacPoliciesUseCase(policyModel);
  });

  it('returns all policies sorted by name', async () => {
    const docs = [
      { _id: new Types.ObjectId(), name: 'beta-policy', description: '', roleIds: [],
        resource: 'device', action: 'read', effect: 'allow', conditions: [], isActive: true },
      { _id: new Types.ObjectId(), name: 'alpha-policy', description: 'first', roleIds: [],
        resource: 'device', action: 'write', effect: 'allow', conditions: [], isActive: false },
    ];
    const mockLean = jest.fn().mockResolvedValue(docs);
    policyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: mockLean }),
    });

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('beta-policy');
    expect(result[1].name).toBe('alpha-policy');
    expect(policyModel.find).toHaveBeenCalled();
  });

  it('returns empty array when no policies exist', async () => {
    const mockLean = jest.fn().mockResolvedValue([]);
    policyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: mockLean }),
    });

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('maps _id to id string correctly', async () => {
    const docId = new Types.ObjectId();
    const docs = [
      { _id: docId, name: 'p1', description: '', roleIds: [],
        resource: 'device', action: 'read', effect: 'allow', conditions: [], isActive: true },
    ];
    const mockLean = jest.fn().mockResolvedValue(docs);
    policyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: mockLean }),
    });

    const result = await useCase.execute();

    expect(result[0].id).toBe(docId.toString());
  });

  it('maps roleIds from ObjectId to string', async () => {
    const roleIds = [new Types.ObjectId(), new Types.ObjectId()];
    const docs = [
      { _id: new Types.ObjectId(), name: 'p1', description: '', roleIds,
        resource: 'device', action: 'read', effect: 'allow', conditions: [], isActive: true },
    ];
    const mockLean = jest.fn().mockResolvedValue(docs);
    policyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: mockLean }),
    });

    const result = await useCase.execute();

    expect(result[0].roleIds).toEqual(roleIds.map(r => r.toString()));
  });

  it('defaults missing optional fields correctly', async () => {
    const docs = [
      { _id: new Types.ObjectId(), name: 'p1', resource: 'device', action: 'read', effect: 'allow', isActive: true },
    ];
    const mockLean = jest.fn().mockResolvedValue(docs);
    policyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: mockLean }),
    });

    const result = await useCase.execute();

    expect(result[0].description).toBe('');
    expect(result[0].roleIds).toEqual([]);
    expect(result[0].conditions).toEqual([]);
  });
});
