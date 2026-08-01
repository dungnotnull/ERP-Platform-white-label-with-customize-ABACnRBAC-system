import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '@/app.module';
import { Types } from 'mongoose';
import _ from 'lodash';

const logger = new Logger('ABAC-Seed');

interface EndpointDef {
  method: string;
  pathPattern: string;
  module: string;
  permission: string;
  description: string;
}

const ENDPOINT_DEFINITIONS: EndpointDef[] = [
  // -- Identity: Users --
  { method: 'GET', pathPattern: '/users', module: 'user', permission: 'read', description: 'List users' },
  { method: 'GET', pathPattern: '/users/profile', module: 'user', permission: 'read', description: 'Get own profile' },
  { method: 'PUT', pathPattern: '/users/profile', module: 'user', permission: 'write', description: 'Update own profile' },
  { method: 'GET', pathPattern: '/users/:id', module: 'user', permission: 'read', description: 'Get user by ID' },
  { method: 'POST', pathPattern: '/users', module: 'user', permission: 'write', description: 'Create user' },
  { method: 'PUT', pathPattern: '/users/:id', module: 'user', permission: 'write', description: 'Update user' },

  // -- Identity: Roles --
  { method: 'GET', pathPattern: '/roles', module: 'role', permission: 'read', description: 'List roles' },
  { method: 'GET', pathPattern: '/roles/:id', module: 'role', permission: 'read', description: 'Get role by ID' },
  { method: 'PUT', pathPattern: '/roles/:id', module: 'role', permission: 'write', description: 'Update role' },

  // -- Identity: Permissions --
  { method: 'GET', pathPattern: '/permissions', module: 'permission', permission: 'read', description: 'List permissions' },
  { method: 'POST', pathPattern: '/permissions', module: 'permission', permission: 'write', description: 'Create permission' },
  { method: 'PUT', pathPattern: '/permissions/:id', module: 'permission', permission: 'write', description: 'Update permission' },
  { method: 'DELETE', pathPattern: '/permissions/:id', module: 'permission', permission: 'delete', description: 'Soft delete permission' },

  // -- Asset: Devices --
  { method: 'GET', pathPattern: '/devices', module: 'device', permission: 'read', description: 'List devices' },
  { method: 'GET', pathPattern: '/devices/statistics', module: 'device', permission: 'read', description: 'Device statistics' },
  { method: 'GET', pathPattern: '/devices/export', module: 'device', permission: 'read', description: 'Export devices' },
  { method: 'GET', pathPattern: '/devices/:id', module: 'device', permission: 'read', description: 'Get device by ID' },
  { method: 'POST', pathPattern: '/devices', module: 'device', permission: 'write', description: 'Create device' },
  { method: 'POST', pathPattern: '/devices/import', module: 'device', permission: 'write', description: 'Import devices' },
  { method: 'PUT', pathPattern: '/devices/:id', module: 'device', permission: 'write', description: 'Update device' },
  { method: 'PUT', pathPattern: '/devices/:id/status', module: 'device', permission: 'write', description: 'Update device status' },
  { method: 'DELETE', pathPattern: '/devices/:id', module: 'device', permission: 'delete', description: 'Soft delete device' },

  // -- Asset: Device Types --
  { method: 'GET', pathPattern: '/device-types', module: 'device-type', permission: 'read', description: 'List device types' },
  { method: 'GET', pathPattern: '/device-types/:id', module: 'device-type', permission: 'read', description: 'Get device type by ID' },
  { method: 'POST', pathPattern: '/device-types', module: 'device-type', permission: 'write', description: 'Create device type' },
  { method: 'PUT', pathPattern: '/device-types/:id', module: 'device-type', permission: 'write', description: 'Update device type' },

  // -- Asset: Device Statuses --
  { method: 'GET', pathPattern: '/device-statuses', module: 'device-status', permission: 'read', description: 'List device statuses' },
  { method: 'GET', pathPattern: '/device-statuses/:id', module: 'device-status', permission: 'read', description: 'Get device status by ID' },
  { method: 'POST', pathPattern: '/device-statuses', module: 'device-status', permission: 'write', description: 'Create device status' },
  { method: 'DELETE', pathPattern: '/device-statuses/:id', module: 'device-status', permission: 'delete', description: 'Delete device status' },

  // -- Asset: Device Assignments --
  { method: 'GET', pathPattern: '/device-assignments/active', module: 'device-assignment', permission: 'read', description: 'List active assignments' },
  { method: 'GET', pathPattern: '/device-assignments/user/:userId', module: 'device-assignment', permission: 'read', description: 'Get assignments by user' },
  { method: 'POST', pathPattern: '/device-assignments', module: 'device-assignment', permission: 'write', description: 'Assign device' },
  { method: 'PUT', pathPattern: '/device-assignments/:id/return', module: 'device-assignment', permission: 'write', description: 'Return device' },

  // -- Asset: Device Maintenance --
  { method: 'GET', pathPattern: '/device-maintenance', module: 'device-maintenance', permission: 'read', description: 'List maintenance records' },
  { method: 'GET', pathPattern: '/device-maintenance/pending', module: 'device-maintenance', permission: 'read', description: 'List pending maintenance' },
  { method: 'GET', pathPattern: '/device-maintenance/device/:deviceId', module: 'device-maintenance', permission: 'read', description: 'Get maintenance by device' },
  { method: 'GET', pathPattern: '/device-maintenance/:id', module: 'device-maintenance', permission: 'read', description: 'Get maintenance record' },
  { method: 'POST', pathPattern: '/device-maintenance', module: 'device-maintenance', permission: 'write', description: 'Create maintenance record' },
  { method: 'PUT', pathPattern: '/device-maintenance/:id', module: 'device-maintenance', permission: 'write', description: 'Update maintenance record' },
  { method: 'DELETE', pathPattern: '/device-maintenance/:id', module: 'device-maintenance', permission: 'delete', description: 'Delete maintenance record' },

  // -- Asset: Device Requests --
  { method: 'GET', pathPattern: '/device-requests', module: 'device-request', permission: 'read', description: 'List device requests' },
  { method: 'GET', pathPattern: '/device-requests/:id', module: 'device-request', permission: 'read', description: 'Get device request by ID' },
  { method: 'POST', pathPattern: '/device-requests', module: 'device-request', permission: 'write', description: 'Create device request' },
  { method: 'PUT', pathPattern: '/device-requests/:id', module: 'device-request', permission: 'write', description: 'Update device request' },
  { method: 'PATCH', pathPattern: '/device-requests/:id/approve', module: 'device-request', permission: 'approve', description: 'Approve device request' },
  { method: 'PATCH', pathPattern: '/device-requests/:id/reject', module: 'device-request', permission: 'approve', description: 'Reject device request' },
  { method: 'PATCH', pathPattern: '/device-requests/:id/complete', module: 'device-request', permission: 'approve', description: 'Complete device request' },
  { method: 'PATCH', pathPattern: '/device-requests/:id/cancel', module: 'device-request', permission: 'write', description: 'Cancel device request' },
  { method: 'DELETE', pathPattern: '/device-requests/:id', module: 'device-request', permission: 'delete', description: 'Delete device request' },

  // -- Organization: Departments --
  { method: 'GET', pathPattern: '/departments', module: 'department', permission: 'read', description: 'List departments' },
  { method: 'GET', pathPattern: '/departments/export', module: 'department', permission: 'read', description: 'Export departments' },
  { method: 'GET', pathPattern: '/departments/:id', module: 'department', permission: 'read', description: 'Get department by ID' },
  { method: 'POST', pathPattern: '/departments', module: 'department', permission: 'write', description: 'Create department' },
  { method: 'POST', pathPattern: '/departments/import', module: 'department', permission: 'write', description: 'Import departments' },
  { method: 'PUT', pathPattern: '/departments/:id', module: 'department', permission: 'write', description: 'Update department' },
  { method: 'DELETE', pathPattern: '/departments/:id', module: 'department', permission: 'delete', description: 'Delete department' },

  // -- Organization: Positions --
  { method: 'GET', pathPattern: '/positions', module: 'position', permission: 'read', description: 'List positions' },
  { method: 'GET', pathPattern: '/positions/export', module: 'position', permission: 'read', description: 'Export positions' },
  { method: 'GET', pathPattern: '/positions/:id', module: 'position', permission: 'read', description: 'Get position by ID' },
  { method: 'POST', pathPattern: '/positions', module: 'position', permission: 'write', description: 'Create position' },
  { method: 'POST', pathPattern: '/positions/import', module: 'position', permission: 'write', description: 'Import positions' },
  { method: 'PUT', pathPattern: '/positions/:id', module: 'position', permission: 'write', description: 'Update position' },
  { method: 'DELETE', pathPattern: '/positions/:id', module: 'position', permission: 'delete', description: 'Delete position' },

  // -- Organization: Internal Users --
  { method: 'GET', pathPattern: '/internal-users', module: 'internal-user', permission: 'read', description: 'List internal users' },
  { method: 'GET', pathPattern: '/internal-users/export', module: 'internal-user', permission: 'read', description: 'Export internal users' },
  { method: 'GET', pathPattern: '/internal-users/:id', module: 'internal-user', permission: 'read', description: 'Get internal user by ID' },
  { method: 'GET', pathPattern: '/internal-users/:id/device-summary', module: 'internal-user', permission: 'read', description: 'Get device summary for internal user' },
  { method: 'POST', pathPattern: '/internal-users', module: 'internal-user', permission: 'write', description: 'Create internal user' },
  { method: 'POST', pathPattern: '/internal-users/import', module: 'internal-user', permission: 'write', description: 'Import internal users' },
  { method: 'PUT', pathPattern: '/internal-users/:id', module: 'internal-user', permission: 'write', description: 'Update internal user' },
  { method: 'DELETE', pathPattern: '/internal-users/:id', module: 'internal-user', permission: 'delete', description: 'Deactivate internal user' },

  // -- Organization: Suppliers --
  { method: 'GET', pathPattern: '/suppliers', module: 'supplier', permission: 'read', description: 'List suppliers' },
  { method: 'GET', pathPattern: '/suppliers/:id', module: 'supplier', permission: 'read', description: 'Get supplier by ID' },
  { method: 'POST', pathPattern: '/suppliers', module: 'supplier', permission: 'write', description: 'Create supplier' },
  { method: 'PUT', pathPattern: '/suppliers/:id', module: 'supplier', permission: 'write', description: 'Update supplier' },

  // -- Organization: Purchase Orders --
  { method: 'GET', pathPattern: '/suppliers/:supplierId/purchase-orders', module: 'purchase-order', permission: 'read', description: 'List purchase orders' },
  { method: 'POST', pathPattern: '/suppliers/:supplierId/purchase-orders', module: 'purchase-order', permission: 'write', description: 'Create purchase order' },
  { method: 'PUT', pathPattern: '/suppliers/:supplierId/purchase-orders/:orderId', module: 'purchase-order', permission: 'write', description: 'Update purchase order' },
  { method: 'POST', pathPattern: '/suppliers/:supplierId/purchase-orders/:orderId/approve', module: 'purchase-order', permission: 'approve', description: 'Approve purchase order' },
];

interface RoleDef {
  name: string;
  displayName: string;
  description: string;
  modulePermFilter: (module: string, perm: string) => boolean;
}

const ROLE_DEFINITIONS: RoleDef[] = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all modules',
    modulePermFilter: () => true,
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Read all + manage assets and organization (no identity management)',
    modulePermFilter: (module, perm) => {
      const identityModules = ['user', 'role', 'permission'];
      if (identityModules.includes(module)) return perm === 'read';
      return true;
    },
  },
  {
    name: 'leader',
    displayName: 'Leader',
    description: 'Read all + device and request operations',
    modulePermFilter: (module, perm) => {
      if (perm === 'read') return true;
      const writeModules = ['device', 'device-assignment', 'device-request'];
      if (writeModules.includes(module) && ['write', 'approve'].includes(perm)) return true;
      return false;
    },
  },
  {
    name: 'member',
    displayName: 'Member',
    description: 'Read-only access to all modules',
    modulePermFilter: (_module, perm) => perm === 'read',
  },
];

function pathPatternToRegex(pattern: string): string {
  const escaped = pattern
    .replace(/\//g, '\\/')
    .replace(/:[^/]+/g, '[^/]+');
  return `^${escaped}$`;
}

async function nextBitIndex(SystemCounterModel: any): Promise<number> {
  const counter = await SystemCounterModel.findOneAndUpdate(
    { key: 'endpoint_permission_bit_index' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq - 1;
}

async function seedModules(ModuleModel: any): Promise<void> {
  const modules = _.uniq(_.map(ENDPOINT_DEFINITIONS, 'module'));
  for (const name of modules) {
    const exists = await ModuleModel.findOne({ name });
    if (!exists) {
      await ModuleModel.create({ name, displayName: _.startCase(name), isActive: true });
    }
  }
  logger.log(`Modules ensured: ${modules.length}`);
}

async function seedSystemCounter(SystemCounterModel: any): Promise<void> {
  const exists = await SystemCounterModel.findOne({ key: 'endpoint_permission_bit_index' });
  if (!exists) {
    await SystemCounterModel.create({ key: 'endpoint_permission_bit_index', seq: 0 });
    logger.log('SystemCounter initialized');
  }
}

async function seedEndpointPermissions(
  EndpointPermissionModel: any,
  SystemCounterModel: any,
): Promise<Map<string, Types.ObjectId>> {
  const existing = await EndpointPermissionModel.find({}).lean();
  if (!_.isEmpty(existing)) {
    logger.log(`Endpoint permissions already seeded (${existing.length} found), skipping`);
    const map = new Map<string, Types.ObjectId>();
    _.forEach(existing, (ep: any) => map.set(`${ep.method}:${ep.pathPattern}`, ep._id));
    return map;
  }

  const map = new Map<string, Types.ObjectId>();
  for (const def of ENDPOINT_DEFINITIONS) {
    const bitIndex = await nextBitIndex(SystemCounterModel);
    const pathRegex = pathPatternToRegex(def.pathPattern);
    const doc = await EndpointPermissionModel.create({
      method: def.method,
      pathPattern: def.pathPattern,
      module: def.module,
      permission: def.permission,
      bitIndex,
      pathRegex,
      isActive: true,
      description: def.description,
    });
    map.set(`${def.method}:${def.pathPattern}`, doc._id);
  }

  logger.log(`Seeded ${ENDPOINT_DEFINITIONS.length} endpoint permissions (bitIndex 0..${ENDPOINT_DEFINITIONS.length - 1})`);
  return map;
}

async function seedRoles(
  RoleModel: any,
  epMap: Map<string, Types.ObjectId>,
): Promise<void> {
  const existing = await RoleModel.find({}).lean();
  const hasAbacRoles = existing.some((r: any) =>
    r.endpointPermissionIds && r.endpointPermissionIds.length > 0,
  );

  if (hasAbacRoles) {
    logger.log(`ABAC roles already seeded (${existing.length} found), skipping`);
    return;
  }

  if (!_.isEmpty(existing)) {
    await RoleModel.deleteMany({});
    logger.log(`Cleared ${existing.length} legacy roles (no ABAC endpoint permissions)`);
  }

  for (const roleDef of ROLE_DEFINITIONS) {
    const permissionIds: Types.ObjectId[] = [];
    for (const def of ENDPOINT_DEFINITIONS) {
      if (roleDef.modulePermFilter(def.module, def.permission)) {
        const id = epMap.get(`${def.method}:${def.pathPattern}`);
        if (id) permissionIds.push(id);
      }
    }

    await RoleModel.create({
      name: roleDef.name,
      displayName: roleDef.displayName,
      description: roleDef.description,
      endpointPermissionIds: permissionIds,
      isSystem: roleDef.name === 'admin',
      isActive: true,
      status: 'ACTIVE',
    });
    logger.log(`Role "${roleDef.name}" created with ${permissionIds.length} endpoint permissions`);
  }
}

async function bootstrap(): Promise<void> {
  logger.log('=== ABAC Seed Start ===');
  const appContext = await NestFactory.createApplicationContext(AppModule);

  try {
    const SystemCounterModel = appContext.get(getModelToken('SystemCounter'));
    const ModuleModel = appContext.get(getModelToken('ModuleEntity'));
    const EndpointPermissionModel = appContext.get(getModelToken('EndpointPermission'));
    const RoleModel = appContext.get(getModelToken('Role'));

    logger.log('--- System counter ---');
    await seedSystemCounter(SystemCounterModel);

    logger.log('--- Modules ---');
    await seedModules(ModuleModel);

    logger.log('--- Endpoint permissions (bitmap) ---');
    const epMap = await seedEndpointPermissions(EndpointPermissionModel, SystemCounterModel);

    logger.log('--- Roles ---');
    await seedRoles(RoleModel, epMap);

    logger.log('=== ABAC Seed Complete ===');
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
