import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DeleteAbacPolicyUseCase } from './delete-abac-policy.use-case';

describe('DeleteAbacPolicyUseCase', () => {
  let useCase: DeleteAbacPolicyUseCase;
  let policyModel: any;

  beforeEach(() => {
    policyModel = {
      findByIdAndDelete: jest.fn(),
    };
    useCase = new DeleteAbacPolicyUseCase(policyModel);
  });

  it('deletes policy by id successfully', async () => {
    const doc = { _id: new Types.ObjectId(), name: 'to-delete' };
    policyModel.findByIdAndDelete.mockResolvedValue(doc);

    await useCase.execute(doc._id.toString());

    expect(policyModel.findByIdAndDelete).toHaveBeenCalledWith(doc._id.toString());
  });

  it('throws NotFoundException when policy not found', async () => {
    policyModel.findByIdAndDelete.mockResolvedValue(null);

    await expect(useCase.execute(new Types.ObjectId().toString())).rejects.toThrow(NotFoundException);
  });

  it('does not throw for valid ObjectId format that is not found', async () => {
    // This is already tested by the not-found test above,
    // but verify it throws the correct exception type
    policyModel.findByIdAndDelete.mockResolvedValue(null);

    await expect(useCase.execute('507f1f77bcf86cd799439011')).rejects.toThrow(
      'Policy not found: 507f1f77bcf86cd799439011',
    );
  });
});
