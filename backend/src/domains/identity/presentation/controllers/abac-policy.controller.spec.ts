import { AbacPolicyController } from './abac-policy.controller';

describe('AbacPolicyController', () => {
  let controller: AbacPolicyController;
  let getPoliciesUseCase: any;
  let createPolicyUseCase: any;
  let updatePolicyUseCase: any;
  let deletePolicyUseCase: any;

  beforeEach(() => {
    getPoliciesUseCase = { execute: jest.fn().mockResolvedValue([]) };
    createPolicyUseCase = { execute: jest.fn().mockResolvedValue({ id: 'p1' }) };
    updatePolicyUseCase = { execute: jest.fn().mockResolvedValue({ id: 'p1' }) };
    deletePolicyUseCase = { execute: jest.fn().mockResolvedValue(undefined) };

    controller = new AbacPolicyController(
      getPoliciesUseCase,
      createPolicyUseCase,
      updatePolicyUseCase,
      deletePolicyUseCase,
    );
  });

  describe('findAll', () => {
    it('calls getPoliciesUseCase.execute()', async () => {
      const policies = [{ id: 'p1', name: 'test' }];
      getPoliciesUseCase.execute.mockResolvedValue(policies);

      const result = await controller.findAll();

      expect(result).toEqual(policies);
      expect(getPoliciesUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('maps currentUser._id to createdBy', async () => {
      const body = { name: 'p1', resource: 'device', action: 'read' };
      const currentUser = { _id: 'user-id-123' };

      await controller.create(body, currentUser);

      expect(createPolicyUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-id-123' }),
      );
    });

    it('falls back to currentUser.userId when _id is missing', async () => {
      const body = { name: 'p2', resource: 'device', action: 'write' };
      const currentUser = { userId: 'user-id-fallback' };

      await controller.create(body, currentUser);

      expect(createPolicyUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-id-fallback' }),
      );
    });

    it('falls back to currentUser.userId when both _id and userId exist (prefers _id)', async () => {
      const body = { name: 'p3', resource: 'device', action: 'delete' };
      const currentUser = { _id: 'primary-id', userId: 'fallback-id' };

      await controller.create(body, currentUser);

      expect(createPolicyUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'primary-id' }),
      );
    });

    it('falls back to "system" when no currentUser', async () => {
      const body = { name: 'p4', resource: 'device', action: 'read' };

      await controller.create(body, undefined);

      expect(createPolicyUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'system' }),
      );
    });

    it('falls back to "system" when currentUser has neither _id nor userId', async () => {
      const body = { name: 'p5', resource: 'device', action: 'read' };
      const currentUser: any = {};

      await controller.create(body, currentUser);

      expect(createPolicyUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'system' }),
      );
    });

    it('defaults empty inputs correctly', async () => {
      const body = { name: 'p6', resource: 'device', action: 'read' };
      const currentUser = { _id: 'u1' };

      await controller.create(body, currentUser);

      expect(createPolicyUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          roleIds: [],
          effect: 'allow',
          conditions: [],
        }),
      );
    });
  });

  describe('update', () => {
    it('calls updatePolicyUseCase with id and body', async () => {
      const body = { description: 'updated', effect: 'deny' as const };

      await controller.update('policy-id-1', body);

      expect(updatePolicyUseCase.execute).toHaveBeenCalledWith({
        id: 'policy-id-1',
        description: 'updated',
        roleIds: undefined,
        effect: 'deny',
        conditions: undefined,
        isActive: undefined,
      });
    });
  });

  describe('remove', () => {
    it('calls deletePolicyUseCase with id', async () => {
      await controller.remove('policy-to-delete');

      expect(deletePolicyUseCase.execute).toHaveBeenCalledWith('policy-to-delete');
    });
  });
});
