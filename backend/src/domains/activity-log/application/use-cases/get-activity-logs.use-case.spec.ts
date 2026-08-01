import { GetActivityLogsUseCase } from './get-activity-logs.use-case';
import { ActivityLogEntity } from '@/domains/activity-log/domain/entities/activity-log.entity';

describe('GetActivityLogsUseCase', () => {
  let useCase: GetActivityLogsUseCase;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findWithFilters: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }),
    };
    useCase = new GetActivityLogsUseCase(mockRepo);
  });

  it('passes through pagination defaults', async () => {
    await useCase.execute({ page: 1, limit: 20 });

    expect(mockRepo.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        sort: 'timestamp',
        order: 'desc',
      }),
    );
  });

  it('passes search and filters to repository', async () => {
    await useCase.execute({
      page: 1,
      limit: 10,
      search: 'admin@dym.com',
      action: 'CREATE',
      method: 'POST',
      userEmail: 'admin@dym.com',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      statusCode: 201,
      sort: 'responseTimeMs',
      order: 'asc',
    });

    expect(mockRepo.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        search: 'admin@dym.com',
        action: 'CREATE',
        method: 'POST',
        userEmail: 'admin@dym.com',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        statusCode: 201,
        sort: 'responseTimeMs',
        order: 'asc',
      }),
    );
  });

  it('maps entity properties to output DTO', async () => {
    const entity = ActivityLogEntity.create({
      userId: 'user-1',
      userEmail: 'test@dym.com',
      userName: 'Test User',
      isSuperadmin: false,
      action: 'DELETE' as any,
      method: 'DELETE',
      endpoint: '/api/v1/devices/abc',
      statusCode: 200,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      requestBody: { reason: 'deprecated' },
      responseTimeMs: 42,
    });

    mockRepo.findWithFilters.mockResolvedValue({
      items: [entity],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      userId: 'user-1',
      userEmail: 'test@dym.com',
      userName: 'Test User',
      isSuperadmin: false,
      action: 'DELETE',
      method: 'DELETE',
      endpoint: '/api/v1/devices/abc',
      statusCode: 200,
      ipAddress: '192.168.1.1',
      requestBody: { reason: 'deprecated' },
      responseTimeMs: 42,
    });
  });

  it('returns pagination metadata', async () => {
    mockRepo.findWithFilters.mockResolvedValue({
      items: [],
      total: 150,
      page: 2,
      limit: 25,
      totalPages: 6,
    });

    const result = await useCase.execute({ page: 2, limit: 25 });

    expect(result.total).toBe(150);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
    expect(result.totalPages).toBe(6);
  });

  it('returns empty items when no results', async () => {
    const result = await useCase.execute({ page: 1, limit: 20 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
