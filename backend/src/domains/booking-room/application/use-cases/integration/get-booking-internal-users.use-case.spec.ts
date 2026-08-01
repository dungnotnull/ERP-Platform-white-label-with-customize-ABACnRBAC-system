import { GetBookingInternalUsersUseCase } from './get-booking-internal-users.use-case';
import { InternalUserQueryPort } from '../../ports/services/internal-user-query.port';
import { DepartmentQueryPort } from '../../ports/services/department-query.port';

describe('GetBookingInternalUsersUseCase', () => {
  const internalUserQueryPort: jest.Mocked<Pick<InternalUserQueryPort, 'findActivePaginated'>> = {
    findActivePaginated: jest.fn(),
  };
  const departmentQueryPort: jest.Mocked<Pick<DepartmentQueryPort, 'findByIds'>> = {
    findByIds: jest.fn(),
  };

  const useCase = new GetBookingInternalUsersUseCase(
    internalUserQueryPort as unknown as InternalUserQueryPort,
    departmentQueryPort as unknown as DepartmentQueryPort,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads only active users via findActivePaginated', async () => {
    internalUserQueryPort.findActivePaginated.mockResolvedValue({
      items: [
        {
          id: 'user-1',
          name: 'Active User',
          email: 'active@example.com',
          departmentId: 'dept-1',
        },
      ],
      total: 1,
      page: 1,
      limit: 30,
      pageCount: 1,
    });
    departmentQueryPort.findByIds.mockResolvedValue([
      { id: 'dept-1', nameVi: 'IT', nameJa: 'IT' },
    ]);

    const result = await useCase.execute({ search: 'active' });

    expect(internalUserQueryPort.findActivePaginated).toHaveBeenCalledWith({
      search: 'active',
      departmentId: undefined,
      page: 1,
      limit: 30,
    });
    expect(result.items).toEqual([
      {
        id: 'user-1',
        name: 'Active User',
        department: { nameVi: 'IT', nameJa: 'IT' },
      },
    ]);
  });
});
