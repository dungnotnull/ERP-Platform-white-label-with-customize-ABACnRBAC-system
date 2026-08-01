import { GetDepartmentUsersUseCase } from './get-department-users.use-case';

describe('GetDepartmentUsersUseCase', () => {
  let useCase: GetDepartmentUsersUseCase;
  let mockPort: any;

  beforeEach(() => {
    mockPort = { findByDepartmentId: jest.fn().mockResolvedValue([]) };
    useCase = new GetDepartmentUsersUseCase(mockPort);
  });

  it('forwards the department id without a search term', async () => {
    await useCase.execute({ departmentId: 'dept_1' });
    expect(mockPort.findByDepartmentId).toHaveBeenCalledWith('dept_1', undefined);
  });

  it('forwards the search term to the port', async () => {
    await useCase.execute({ departmentId: 'dept_1', search: 'Tanaka' });
    expect(mockPort.findByDepartmentId).toHaveBeenCalledWith('dept_1', 'Tanaka');
  });

  it('returns the port result unchanged', async () => {
    const expected = [{ id: 'u1', name: 'Tanaka', email: 't@x.com', departmentId: 'dept_1' }];
    mockPort.findByDepartmentId.mockResolvedValue(expected);
    const result = await useCase.execute({ departmentId: 'dept_1', search: 'tan' });
    expect(result).toEqual(expected);
  });
});
