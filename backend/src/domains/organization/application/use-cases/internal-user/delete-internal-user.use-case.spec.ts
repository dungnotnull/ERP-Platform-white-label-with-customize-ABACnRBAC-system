import { DeleteInternalUserUseCase } from './delete-internal-user.use-case';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { AssignmentQueryPort } from '@/domains/organization/application/ports/services/assignment-query.port';
import { InternalUserEntity } from '@/domains/organization/domain/entities/internal-user.entity';
import { InternalUserNotFoundException } from '@/domains/organization/domain/exceptions/internal-user-not-found.exception';
import { InternalUserHasAssignedDevicesException } from '@/domains/organization/domain/exceptions/internal-user-has-assigned-devices.exception';

describe('DeleteInternalUserUseCase', () => {
  const userId = '507f1f77bcf86cd799439011';

  let useCase: DeleteInternalUserUseCase;
  let internalUserRepository: { findById: jest.Mock; save: jest.Mock };
  let assignmentQueryPort: { getDeviceSummaryByUser: jest.Mock };

  const user = new InternalUserEntity(userId, {
    name: 'Alice',
    email: 'alice@company.com',
    employeeCode: 'EMP-001',
    departmentId: '6a0c224c5b9357fe62164fca',
    positionId: '507f1f77bcf86cd799439012',
    isActive: true,
    isDeleted: false,
    role: 'employee',
    deviceSummary: { total: 0, activeAssignments: 0 },
  });

  beforeEach(() => {
    internalUserRepository = {
      findById: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockResolvedValue(user),
    };
    assignmentQueryPort = {
      getDeviceSummaryByUser: jest.fn().mockResolvedValue({
        total: 0,
        activeAssignments: 0,
      }),
    };
    useCase = new DeleteInternalUserUseCase(
      internalUserRepository as unknown as InternalUserRepositoryPort,
      assignmentQueryPort as unknown as AssignmentQueryPort,
    );
  });

  it('soft-deletes when user has no assigned devices', async () => {
    const result = await useCase.execute({ id: userId });

    expect(result).toEqual({ deleted: true });
    expect(assignmentQueryPort.getDeviceSummaryByUser).toHaveBeenCalledWith(
      userId,
    );
    expect(internalUserRepository.save).toHaveBeenCalled();
    expect(user.isDeleted).toBe(true);
  });

  it('throws when devices are still assigned', async () => {
    assignmentQueryPort.getDeviceSummaryByUser.mockResolvedValue({
      total: 2,
      activeAssignments: 2,
    });

    await expect(useCase.execute({ id: userId })).rejects.toThrow(
      InternalUserHasAssignedDevicesException,
    );
    expect(internalUserRepository.save).not.toHaveBeenCalled();
  });

  it('throws when user is not found', async () => {
    internalUserRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: userId })).rejects.toThrow(
      InternalUserNotFoundException,
    );
  });
});
