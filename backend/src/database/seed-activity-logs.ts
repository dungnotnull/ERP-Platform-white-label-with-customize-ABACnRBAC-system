import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '@/app.module';
import { ActivityAction } from '@/domains/activity-log/domain/enums/activity-action.enum';

const logger = new Logger('ActivityLog-Seed');

interface LogEntrySeed {
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

const USERS = [
  { userId: 'user-superadmin-001', email: 'superadmin@test.com', name: 'Super Admin' },
  { userId: 'user-admin-001', email: 'admin@test.com', name: 'Admin User' },
  { userId: 'user-manager-001', email: 'manager@test.com', name: 'Manager One' },
  { userId: 'user-operator-001', email: 'operator@test.com', name: 'Operator Two' },
  { userId: 'user-viewer-001', email: 'viewer@test.com', name: 'Viewer Three' },
];

const ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/devices',
  '/api/v1/devices/507f1f77bcf86cd799439011',
  '/api/v1/users',
  '/api/v1/users/507f1f77bcf86cd799439022',
  '/api/v1/roles',
  '/api/v1/roles/507f1f77bcf86cd799439033',
  '/api/v1/departments',
  '/api/v1/departments/507f1f77bcf86cd799439044',
  '/api/v1/suppliers',
  '/api/v1/suppliers/507f1f77bcf86cd799439055',
  '/api/v1/internal-users',
  '/api/v1/permissions',
];

const IP_ADDRESSES = [
  '192.168.1.100',
  '192.168.1.101',
  '192.168.1.102',
  '10.0.0.50',
  '10.0.0.51',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  'PostmanRuntime/7.36.0',
  'curl/8.1.2',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
];

function generateLogs(): LogEntrySeed[] {
  const logs: LogEntrySeed[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 100; i++) {
    const user = USERS[i % USERS.length];
    const daysAgo = Math.floor(i / 4) % 30; // spread across 30 days, ~3-4 logs per day
    const jitter = (i % 4) * 3600 * 1000; // spread within day

    let action: ActivityAction;
    let method: string;
    let endpoint: string;
    let statusCode: number;

    const variant = i % 12;
    switch (variant) {
      case 0:
        action = ActivityAction.LOGIN;
        method = 'POST';
        endpoint = '/api/v1/auth/login';
        statusCode = 200;
        break;
      case 1:
        action = ActivityAction.REGISTER;
        method = 'POST';
        endpoint = '/api/v1/auth/register';
        statusCode = 201;
        break;
      case 2:
        action = ActivityAction.CREATE;
        method = 'POST';
        endpoint = ENDPOINTS[2 + (i % 5)]; // devices, users, roles, departments, suppliers
        statusCode = [200, 201, 400, 500][i % 4];
        break;
      case 3:
        action = ActivityAction.CREATE;
        method = 'POST';
        endpoint = ENDPOINTS[(i % 5) + 6];
        statusCode = 201;
        break;
      case 4:
      case 5:
        action = ActivityAction.UPDATE;
        method = i % 2 === 0 ? 'PUT' : 'PATCH';
        endpoint = ENDPOINTS[3 + (i % 6)];
        statusCode = [200, 400, 404, 403][i % 4];
        break;
      case 6:
      case 7:
        action = ActivityAction.DELETE;
        method = 'DELETE';
        endpoint = ENDPOINTS[3 + (i % 6)];
        statusCode = [200, 404, 403][i % 3];
        break;
      case 8:
        action = ActivityAction.CREATE;
        method = 'POST';
        endpoint = '/api/v1/devices';
        statusCode = [200, 201, 400, 500][i % 4];
        break;
      case 9:
        action = ActivityAction.UPDATE;
        method = 'PUT';
        endpoint = '/api/v1/users/' + (507000000000000000000000 + i).toString(16);
        statusCode = [200, 404, 403][i % 3];
        break;
      case 10:
        action = ActivityAction.LOGIN;
        method = 'POST';
        endpoint = '/api/v1/auth/login';
        statusCode = [200, 403, 400][i % 3];
        break;
      default:
        action = ActivityAction.DELETE;
        method = 'DELETE';
        endpoint = '/api/v1/roles/' + (507000000000000000000100 + i).toString(16);
        statusCode = [200, 404][i % 2];
    }

    const timestamp = new Date(now - daysAgo * oneDay - jitter);

    logs.push({
      userId: user.userId,
      userEmail: user.email,
      userName: user.name,
      action,
      method,
      endpoint,
      statusCode,
      ipAddress: IP_ADDRESSES[i % IP_ADDRESSES.length],
      userAgent: USER_AGENTS[i % USER_AGENTS.length],
      responseTimeMs: Math.floor(50 + Math.random() * 1950),
      timestamp,
    });
  }

  return logs;
}

async function bootstrap(): Promise<void> {
  logger.log('=== Activity Log Seed Start ===');
  const appContext = await NestFactory.createApplicationContext(AppModule);

  try {
    const ActivityLogModel = appContext.get(getModelToken('ActivityLog', 'activityLogs'));

    const existingCount = await ActivityLogModel.countDocuments();
    if (existingCount > 0) {
      logger.log(`Clearing ${existingCount} existing activity logs for re-seed`);
      await ActivityLogModel.deleteMany({});
    }

    const logs = generateLogs();
    await ActivityLogModel.insertMany(logs);
    logger.log(`Seeded ${logs.length} activity log entries`);

    const breakdown: Record<string, number> = {};
    for (const log of logs) {
      breakdown[log.action] = (breakdown[log.action] || 0) + 1;
    }
    logger.log('Action breakdown:', JSON.stringify(breakdown));
    logger.log('Date range:', logs[logs.length - 1].timestamp.toISOString(), 'to', logs[0].timestamp.toISOString());
    logger.log('Users seeded:', USERS.map((u) => u.email).join(', '));
    logger.log('Status codes present:', Array.from(new Set(logs.map((l) => l.statusCode))).sort().join(', '));
    logger.log('');
    logger.log('=== Activity Log Seed Complete ===');
  } catch (error) {
    logger.error('Seeding failed', error);
    throw error;
  } finally {
    await appContext.close();
  }
}

bootstrap().catch((error) => {
  logger.error('Fatal seeding error', error);
  process.exit(1);
});
