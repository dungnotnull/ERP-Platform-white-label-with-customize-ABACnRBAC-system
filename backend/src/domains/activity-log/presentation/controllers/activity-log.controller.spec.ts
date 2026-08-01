import { ActivityLogController } from './activity-log.controller';
import { GetActivityLogsUseCase } from '@/domains/activity-log/application/use-cases/get-activity-logs.use-case';
import { ForbiddenException } from '@nestjs/common';

describe('ActivityLogController', () => {
  let controller: ActivityLogController;
  let getActivityLogsUseCase: any;

  beforeEach(() => {
    getActivityLogsUseCase = {
      execute: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }),
    };
    controller = new ActivityLogController(getActivityLogsUseCase);
  });

  describe('getLogs', () => {
    it('throws ForbiddenException when user is not superadmin', async () => {
      const req = { user: { isSuperadmin: false } };
      await expect(controller.getLogs(req, {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when req.user is undefined', async () => {
      const req = { user: undefined };
      await expect(controller.getLogs(req, {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user has no isSuperadmin prop', async () => {
      const req = { user: {} };
      await expect(controller.getLogs(req, {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('calls useCase.execute with default pagination when superadmin', async () => {
      const req = { user: { isSuperadmin: true } };
      await controller.getLogs(req, {} as any);

      expect(getActivityLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
          sort: 'timestamp',
          order: 'desc',
        }),
      );
    });

    it('calls useCase.execute with parsed query params', async () => {
      const req = { user: { isSuperadmin: true } };
      const query = {
        page: '2',
        limit: '10',
        search: 'test@example.com',
        action: 'LOGIN',
        method: 'POST',
        userEmail: 'user@test.com',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-06-01T00:00:00.000Z',
        statusCode: 200,
        sort: 'action',
        order: 'asc',
      };

      await controller.getLogs(req, query as any);

      expect(getActivityLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          search: 'test@example.com',
          action: 'LOGIN',
          method: 'POST',
          userEmail: 'user@test.com',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-06-01T00:00:00.000Z',
          statusCode: 200,
          sort: 'action',
          order: 'asc',
        }),
      );
    });

    it('returns the useCase result', async () => {
      const req = { user: { isSuperadmin: true } };
      const expectedResult = {
        items: [{ id: '1', action: 'LOGIN' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      getActivityLogsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.getLogs(req, {} as any);
      expect(result).toEqual(expectedResult);
    });
  });
});
