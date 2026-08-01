import { GetBookingDepartmentsUseCase } from './get-booking-departments.use-case';
import { GetDepartmentsUseCase } from '@/domains/organization/application/use-cases/department/get-departments.use-case';

describe('GetBookingDepartmentsUseCase', () => {
  const getDepartmentsUseCase = {
    execute: jest.fn(),
  };

  const useCase = new GetBookingDepartmentsUseCase(
    getDepartmentsUseCase as unknown as GetDepartmentsUseCase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns departments from GetDepartmentsUseCase without filtering', async () => {
    const payload = {
      items: [
        { id: '1', code: 'IT', nameVi: 'IT', nameJa: 'IT', description: '' },
        {
          id: '2',
          code: 'TTS',
          nameVi: 'THỰC TẬP SINH',
          nameJa: '研修生',
          description: '',
        },
      ],
      total: 2,
      page: 1,
      limit: 1000,
    };
    getDepartmentsUseCase.execute.mockResolvedValue(payload);

    const result = await useCase.execute({});

    expect(getDepartmentsUseCase.execute).toHaveBeenCalledWith({
      search: undefined,
      page: 1,
      limit: 1000,
    });
    expect(result).toEqual(payload);
  });
});
