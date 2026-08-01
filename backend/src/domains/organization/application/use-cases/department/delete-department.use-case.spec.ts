import { DeleteDepartmentUseCase } from './delete-department.use-case';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';
import { DepartmentNotFoundException } from '@/domains/organization/domain/exceptions/department-not-found.exception';
import { DepartmentHasUsersException } from '@/domains/organization/domain/exceptions/department-has-users.exception';

describe('DeleteDepartmentUseCase', () => {
  const departmentId = '6a0c224c5b9357fe62164fca';

  let useCase: DeleteDepartmentUseCase;
  let departmentRepository: {
    findById: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    removeFromAllUsers: jest.Mock;
    removeFromAllRoles: jest.Mock;
  };
  let internalUserRepository: { countByDepartmentId: jest.Mock };

  const department = new DepartmentEntity(departmentId, {
    code: 'ENG',
    nameVi: 'Kỹ thuật',
    nameJa: '',
    description: '',
    isDeleted: false,
  });

  beforeEach(() => {
    departmentRepository = {
      findById: jest.fn().mockResolvedValue(department),
      save: jest.fn().mockResolvedValue(department),
      delete: jest.fn().mockResolvedValue(undefined),
      removeFromAllUsers: jest.fn(),
      removeFromAllRoles: jest.fn(),
    };
    internalUserRepository = {
      countByDepartmentId: jest.fn().mockResolvedValue(0),
    };
    useCase = new DeleteDepartmentUseCase(
      departmentRepository as unknown as DepartmentRepositoryPort,
      internalUserRepository as unknown as InternalUserRepositoryPort,
    );
  });

  it('soft-deletes when department has no employees', async () => {
    const result = await useCase.execute({ id: departmentId });

    expect(result).toEqual({ deleted: true });
    expect(internalUserRepository.countByDepartmentId).toHaveBeenCalledWith(
      departmentId,
    );
    expect(departmentRepository.save).toHaveBeenCalled();
    expect(department.isDeleted).toBe(true);
  });

  it('throws when employees are still assigned', async () => {
    internalUserRepository.countByDepartmentId.mockResolvedValue(3);

    await expect(useCase.execute({ id: departmentId })).rejects.toThrow(
      DepartmentHasUsersException,
    );
    expect(departmentRepository.save).not.toHaveBeenCalled();
  });

  it('throws when department is not found', async () => {
    departmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: departmentId })).rejects.toThrow(
      DepartmentNotFoundException,
    );
  });
});
