import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ActivityLog, ActivityLogSchema } from '@/domains/activity-log/infrastructure/persistence/schemas/activity-log.schema';
import { ActivityLogRepository } from '@/domains/activity-log/infrastructure/persistence/repositories/activity-log.repository';
import { GetActivityLogsUseCase } from '@/domains/activity-log/application/use-cases/get-activity-logs.use-case';
import { ActivityAction } from '@/domains/activity-log/domain/enums/activity-action.enum';

function now(): Date { return new Date('2026-05-26T12:00:00.000Z'); }

interface SeedEntry {
  userId: string;
  userEmail: string;
  userName: string;
  action: ActivityAction;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  responseTimeMs: number;
  timestamp: Date;
}

const BASE = Date.UTC(2026, 4, 26, 12, 0, 0, 0); // May 26, 2026 12:00:00 UTC
const H = 3600_000;

const SEED_DATA: SeedEntry[] = [
  {
    userId: 'u-1', userEmail: 'superadmin@test.com', userName: 'Super Admin',
    action: ActivityAction.LOGIN, method: 'POST', endpoint: '/api/v1/auth/login',
    statusCode: 200, ipAddress: '192.168.1.10', userAgent: 'Chrome/120',
    responseTimeMs: 150, timestamp: new Date(BASE - 1 * H),
  },
  {
    userId: 'u-2', userEmail: 'admin@test.com', userName: 'Admin User',
    action: ActivityAction.CREATE, method: 'POST', endpoint: '/api/v1/devices',
    statusCode: 201, ipAddress: '192.168.1.20', userAgent: 'Firefox/121',
    responseTimeMs: 350, timestamp: new Date(BASE - 2 * H),
  },
  {
    userId: 'u-3', userEmail: 'manager@test.com', userName: 'Manager One',
    action: ActivityAction.UPDATE, method: 'PUT', endpoint: '/api/v1/devices/abc',
    statusCode: 200, ipAddress: '192.168.1.30', userAgent: 'Safari/605',
    responseTimeMs: 200, timestamp: new Date(BASE - 3 * H),
  },
  {
    userId: 'u-4', userEmail: 'operator@test.com', userName: 'Operator Two',
    action: ActivityAction.DELETE, method: 'DELETE', endpoint: '/api/v1/devices/abc',
    statusCode: 200, ipAddress: '10.0.0.50', userAgent: 'Postman/7.36',
    responseTimeMs: 500, timestamp: new Date(BASE - 4 * H),
  },
  {
    userId: 'u-1', userEmail: 'superadmin@test.com', userName: 'Super Admin',
    action: ActivityAction.CREATE, method: 'POST', endpoint: '/api/v1/users',
    statusCode: 400, ipAddress: '192.168.1.10', userAgent: 'Chrome/120',
    responseTimeMs: 80, timestamp: new Date(BASE - 5 * H),
  },
  {
    userId: 'u-5', userEmail: 'viewer@test.com', userName: 'Viewer Three',
    action: ActivityAction.LOGIN, method: 'POST', endpoint: '/api/v1/auth/login',
    statusCode: 403, ipAddress: '192.168.1.50', userAgent: 'Chrome/120',
    responseTimeMs: 120, timestamp: new Date(BASE - 6 * H),
  },
  {
    userId: 'u-2', userEmail: 'admin@test.com', userName: 'Admin User',
    action: ActivityAction.UPDATE, method: 'PATCH', endpoint: '/api/v1/roles',
    statusCode: 200, ipAddress: '192.168.1.20', userAgent: 'Firefox/121',
    responseTimeMs: 450, timestamp: new Date(BASE - 7 * H),
  },
  {
    userId: 'u-3', userEmail: 'manager@test.com', userName: 'Manager One',
    action: ActivityAction.DELETE, method: 'DELETE', endpoint: '/api/v1/suppliers',
    statusCode: 404, ipAddress: '192.168.1.30', userAgent: 'Safari/605',
    responseTimeMs: 250, timestamp: new Date(BASE - 8 * H),
  },
  {
    userId: 'u-4', userEmail: 'operator@test.com', userName: 'Operator Two',
    action: ActivityAction.CREATE, method: 'POST', endpoint: '/api/v1/departments',
    statusCode: 500, ipAddress: '10.0.0.50', userAgent: 'Postman/7.36',
    responseTimeMs: 1000, timestamp: new Date(BASE - 9 * H),
  },
  {
    userId: 'u-1', userEmail: 'superadmin@test.com', userName: 'Super Admin',
    action: ActivityAction.REGISTER, method: 'POST', endpoint: '/api/v1/auth/register',
    statusCode: 201, ipAddress: '192.168.1.10', userAgent: 'Chrome/120',
    responseTimeMs: 300, timestamp: new Date(BASE - 10 * H),
  },
];

describe('ActivityLog System — Integration', () => {
  let mongod: MongoMemoryServer;
  let model: any;
  let repository: ActivityLogRepository;
  let useCase: GetActivityLogsUseCase;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
    model = mongoose.model(ActivityLog.name, ActivityLogSchema);
    repository = new ActivityLogRepository(model);
    useCase = new GetActivityLogsUseCase(repository);

    for (const entry of SEED_DATA) {
      await model.create(entry);
    }
    // Small delay to ensure text index is built
    await new Promise((r) => setTimeout(r, 500));
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // =========================================================================
  // Pagination
  // =========================================================================
  describe('pagination', () => {
    it('returns default page 1 with limit 20', async () => {
      const result = await useCase.execute({ page: 1, limit: 20 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(10);
    });

    it('returns correct total, totalPages, page, limit with smaller limit', async () => {
      const result = await useCase.execute({ page: 1, limit: 3 });
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(4);
      expect(result.items).toHaveLength(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
    });

    it('returns second page correctly', async () => {
      const page1 = await useCase.execute({ page: 1, limit: 3, sort: 'timestamp', order: 'asc' });
      const page2 = await useCase.execute({ page: 2, limit: 3, sort: 'timestamp', order: 'asc' });
      expect(page2.items).toHaveLength(3);
      expect(page2.page).toBe(2);
      // Ensure no overlap
      const page1Ids = page1.items.map((i) => i.id);
      const page2Ids = page2.items.map((i) => i.id);
      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id);
      }
    });

    it('returns partial page for last page', async () => {
      const result = await useCase.execute({ page: 4, limit: 3, sort: 'timestamp', order: 'asc' });
      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(4);
    });

    it('returns empty items when page exceeds totalPages', async () => {
      const result = await useCase.execute({ page: 10, limit: 20 });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(10);
    });
  });

  // =========================================================================
  // Action filter
  // =========================================================================
  describe('action filter', () => {
    it('filters by LOGIN', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, action: ActivityAction.LOGIN });
      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.action === ActivityAction.LOGIN)).toBe(true);
    });

    it('filters by CREATE', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, action: ActivityAction.CREATE });
      expect(result.total).toBe(3);
      expect(result.items.every((i) => i.action === ActivityAction.CREATE)).toBe(true);
    });

    it('filters by DELETE', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, action: ActivityAction.DELETE });
      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.action === ActivityAction.DELETE)).toBe(true);
    });

    it('filters by REGISTER', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, action: ActivityAction.REGISTER });
      expect(result.total).toBe(1);
      expect(result.items[0].action).toBe(ActivityAction.REGISTER);
    });

    it('returns empty for non-matching action', async () => {
      const result = await useCase.execute({
        page: 1, limit: 20,
        action: 'NONEXISTENT' as any,
      });
      expect(result.total).toBe(0);
    });
  });

  // =========================================================================
  // Method filter
  // =========================================================================
  describe('method filter', () => {
    it('filters by POST', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, method: 'POST' });
      expect(result.total).toBe(6);
      expect(result.items.every((i) => i.method === 'POST')).toBe(true);
    });

    it('filters by DELETE', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, method: 'DELETE' });
      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.method === 'DELETE')).toBe(true);
    });

    it('filters by PATCH', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, method: 'PATCH' });
      expect(result.total).toBe(1);
      expect(result.items[0].method).toBe('PATCH');
    });

    it('case-insensitive — lowercase method works', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, method: 'post' });
      expect(result.total).toBe(6);
    });
  });

  // =========================================================================
  // userEmail filter
  // =========================================================================
  describe('userEmail filter', () => {
    it('matches exact email', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, userEmail: 'superadmin@test.com' });
      expect(result.total).toBe(3);
      expect(result.items.every((i) => i.userEmail === 'superadmin@test.com')).toBe(true);
    });

    it('matches case-insensitive partial', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, userEmail: 'SUPERADMIN' });
      expect(result.total).toBe(3);
    });

    it('matches by domain', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, userEmail: '@test.com' });
      expect(result.total).toBe(10);
    });

    it('returns empty for non-matching email', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, userEmail: 'nonexistent@no.com' });
      expect(result.total).toBe(0);
    });
  });

  // =========================================================================
  // statusCode filter
  // =========================================================================
  describe('statusCode filter', () => {
    it('filters by 200', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, statusCode: 200 });
      expect(result.total).toBe(4);
      expect(result.items.every((i) => i.statusCode === 200)).toBe(true);
    });

    it('filters by 201', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, statusCode: 201 });
      expect(result.total).toBe(2);
    });

    it('filters by 500', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, statusCode: 500 });
      expect(result.total).toBe(1);
      expect(result.items[0].statusCode).toBe(500);
    });

    it('filters by 403', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, statusCode: 403 });
      expect(result.total).toBe(1);
    });

    it('filters by 404', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, statusCode: 404 });
      expect(result.total).toBe(1);
    });

    it('filters by 400', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, statusCode: 400 });
      expect(result.total).toBe(1);
    });
  });

  // =========================================================================
  // Date range filter
  // =========================================================================
  describe('date range filter', () => {
    it('filters by startDate only', async () => {
      const start = new Date(BASE - 5.5 * H).toISOString();
      const result = await useCase.execute({ page: 1, limit: 20, startDate: start });
      expect(result.total).toBe(5); // entries at -1h to -5h
      expect(result.items.every((i) => new Date(i.timestamp).getTime() >= new Date(start).getTime())).toBe(true);
    });

    it('filters by endDate only', async () => {
      const end = new Date(BASE - 5.5 * H).toISOString();
      const result = await useCase.execute({ page: 1, limit: 20, endDate: end });
      expect(result.total).toBe(5); // entries at -6h to -10h
      expect(result.items.every((i) => new Date(i.timestamp).getTime() <= new Date(end).getTime())).toBe(true);
    });

    it('filters by startDate + endDate combined', async () => {
      const start = new Date(BASE - 5.5 * H).toISOString();
      const end = new Date(BASE - 2.5 * H).toISOString();
      const result = await useCase.execute({ page: 1, limit: 20, startDate: start, endDate: end });
      expect(result.total).toBe(3); // entries at -3h, -4h, -5h
    });

    it('returns empty when date range has no matches', async () => {
      const start = new Date(BASE + 1 * H).toISOString();
      const end = new Date(BASE + 10 * H).toISOString();
      const result = await useCase.execute({ page: 1, limit: 20, startDate: start, endDate: end });
      expect(result.total).toBe(0);
    });
  });

  // =========================================================================
  // Full-text search
  // =========================================================================
  describe('full-text search', () => {
    it('finds logs by endpoint keyword', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, search: 'devices' });
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.items.every((i) => i.endpoint.includes('devices'))).toBe(true);
    });

    it('finds logs by userEmail', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, search: 'operator' });
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.items.some((i) => i.userEmail === 'operator@test.com')).toBe(true);
    });

    it('finds logs by userName', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, search: 'Admin' });
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('finds logs by auth endpoint', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, search: 'login' });
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.items.every((i) => i.endpoint.includes('login'))).toBe(true);
    });

    it('returns empty for non-matching search term', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, search: 'xyznonexistentzzz' });
      expect(result.total).toBe(0);
    });
  });

  // =========================================================================
  // Sorting
  // =========================================================================
  describe('sorting', () => {
    it('sorts by timestamp desc (default)', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, sort: 'timestamp', order: 'desc' });
      expect(result.items).toHaveLength(10);
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(new Date(result.items[i].timestamp).getTime())
          .toBeGreaterThanOrEqual(new Date(result.items[i + 1].timestamp).getTime());
      }
    });

    it('sorts by timestamp asc', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, sort: 'timestamp', order: 'asc' });
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(new Date(result.items[i].timestamp).getTime())
          .toBeLessThanOrEqual(new Date(result.items[i + 1].timestamp).getTime());
      }
    });

    it('sorts by action', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, sort: 'action', order: 'asc' });
      expect(result.items[0].action).toBe('CREATE');
    });

    it('sorts by method', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, sort: 'method', order: 'asc' });
      const methods = result.items.map((i) => i.method);
      expect(methods).toEqual([...methods].sort());
    });

    it('sorts by statusCode', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, sort: 'statusCode', order: 'asc' });
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].statusCode).toBeLessThanOrEqual(result.items[i + 1].statusCode);
      }
    });

    it('sorts by responseTimeMs', async () => {
      const result = await useCase.execute({ page: 1, limit: 20, sort: 'responseTimeMs', order: 'asc' });
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].responseTimeMs).toBeLessThanOrEqual(result.items[i + 1].responseTimeMs);
      }
    });
  });

  // =========================================================================
  // Combined filters
  // =========================================================================
  describe('combined filters', () => {
    it('action + method combined', async () => {
      const result = await useCase.execute({
        page: 1, limit: 20,
        action: ActivityAction.CREATE,
        method: 'POST',
      });
      expect(result.total).toBe(3);
      expect(result.items.every((i) => i.action === ActivityAction.CREATE && i.method === 'POST')).toBe(true);
    });

    it('action + dateRange + statusCode combined', async () => {
      const start = new Date(BASE - 3.5 * H).toISOString();
      const end = new Date(BASE - 0.5 * H).toISOString();
      const result = await useCase.execute({
        page: 1, limit: 20,
        action: ActivityAction.CREATE,
        startDate: start,
        endDate: end,
        statusCode: 400,
      });
      expect(result.total).toBe(0); // CREATE at -5h has statusCode 400, but -5h is outside -3.5h..-0.5h range
    });

    it('action + dateRange combined (matching)', async () => {
      const start = new Date(BASE - 6 * H).toISOString();
      const end = new Date(BASE - 4 * H).toISOString();
      const result = await useCase.execute({
        page: 1, limit: 20,
        action: ActivityAction.CREATE,
        startDate: start,
        endDate: end,
      });
      expect(result.total).toBe(1); // only the -5h CREATE
      expect(result.items[0].statusCode).toBe(400);
    });

    it('search + action combined', async () => {
      const result = await useCase.execute({
        page: 1, limit: 20,
        search: 'devices',
        action: ActivityAction.CREATE,
      });
      expect(result.total).toBe(1);
      expect(result.items[0].endpoint).toBe('/api/v1/devices');
      expect(result.items[0].action).toBe(ActivityAction.CREATE);
    });

    it('userEmail + method + sort combined', async () => {
      const result = await useCase.execute({
        page: 1, limit: 20,
        userEmail: 'superadmin',
        method: 'POST',
        sort: 'timestamp',
        order: 'asc',
      });
      expect(result.items.every((i) => i.userEmail === 'superadmin@test.com')).toBe(true);
      expect(result.items.every((i) => i.method === 'POST')).toBe(true);
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(new Date(result.items[i].timestamp).getTime())
          .toBeLessThanOrEqual(new Date(result.items[i + 1].timestamp).getTime());
      }
    });

    it('pagination + filter work together', async () => {
      const result = await useCase.execute({
        page: 2, limit: 2,
        userEmail: 'superadmin',
        sort: 'timestamp',
        order: 'asc',
      });
      expect(result.total).toBe(3);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.items).toHaveLength(1);
    });
  });

  // =========================================================================
  // Output shape
  // =========================================================================
  describe('output DTO shape', () => {
    it('each item has all expected fields', async () => {
      const result = await useCase.execute({ page: 1, limit: 1 });
      const item = result.items[0];
      expect(typeof item.id).toBe('string');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('userEmail');
      expect(item).toHaveProperty('userName');
      expect(item).toHaveProperty('isSuperadmin');
      expect(item).toHaveProperty('action');
      expect(item).toHaveProperty('method');
      expect(item).toHaveProperty('endpoint');
      expect(item).toHaveProperty('statusCode');
      expect(item).toHaveProperty('ipAddress');
      expect(item).toHaveProperty('userAgent');
      expect(item).toHaveProperty('requestBody');
      expect(item).toHaveProperty('responseTimeMs');
      expect(item).toHaveProperty('timestamp');
    });
  });
});
