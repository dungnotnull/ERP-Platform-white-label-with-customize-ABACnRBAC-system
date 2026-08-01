import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SystemCounter } from '@/domains/identity/infrastructure/persistence/schemas/system-counter.schema';
import { ModuleEntity } from '@/domains/identity/infrastructure/persistence/schemas/module.schema';
import { Role } from '@/domains/identity/infrastructure/persistence/schemas/role.schema';
import { User } from '@/domains/identity/infrastructure/persistence/schemas/user.schema';

export async function seedAbacData(
  systemCounterModel: Model<SystemCounter>,
  moduleModel: Model<ModuleEntity>,
  roleModel: Model<Role>,
  userModel: Model<User>,
): Promise<void> {
  await seedSystemCounter(systemCounterModel);
  await seedModules(moduleModel);
  await seedDefaultRoles(roleModel);
  await seedSuperadmin(userModel);
}

async function seedSystemCounter(model: Model<SystemCounter>): Promise<void> {
  const exists = await model.findOne({ key: 'endpoint_permission_bit_index' });
  if (!exists) {
    await model.create({ key: 'endpoint_permission_bit_index', seq: 0 });
  }
}

async function seedModules(model: Model<ModuleEntity>): Promise<void> {
  const modules = [
    { name: 'user', displayName: 'User Management' },
    { name: 'role', displayName: 'Role Management' },
    { name: 'device', displayName: 'Device Management' },
    { name: 'device-type', displayName: 'Device Type Management' },
    { name: 'device-status', displayName: 'Device Status Management' },
    { name: 'device-assignment', displayName: 'Device Assignment' },
    { name: 'device-maintenance', displayName: 'Device Maintenance' },
    { name: 'device-request', displayName: 'Device Request' },
    { name: 'department', displayName: 'Department Management' },
    { name: 'position', displayName: 'Position Management' },
    { name: 'internal-user', displayName: 'Internal User Management' },
    { name: 'supplier', displayName: 'Supplier Management' },
    { name: 'purchase-order', displayName: 'Purchase Order Management' },
    { name: 'report', displayName: 'Report Management' },
  ];

  for (const mod of modules) {
    const exists = await model.findOne({ name: mod.name });
    if (!exists) {
      await model.create(mod);
    }
  }
}

async function seedDefaultRoles(model: Model<Role>): Promise<void> {
  const roles = [
    { name: 'admin', displayName: 'Administrator', isSystem: false, isActive: true, description: 'Full access within assigned department' },
    { name: 'manager', displayName: 'Manager', isSystem: false, isActive: true, description: 'Manage resources within assigned department' },
    { name: 'leader', displayName: 'Leader', isSystem: false, isActive: true, description: 'Team leader with limited management access' },
    { name: 'member', displayName: 'Member', isSystem: false, isActive: true, description: 'Basic read access within assigned department' },
  ];

  for (const role of roles) {
    const exists = await model.findOne({ name: role.name });
    if (!exists) {
      await model.create({ ...role, endpointPermissionIds: [], status: 'ACTIVE' });
    }
  }
}

async function seedSuperadmin(model: Model<User>): Promise<void> {
  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;
  if (!superadminPassword) {
    throw new Error(
      'SUPERADMIN_PASSWORD env var is required to seed the superadmin',
    );
  }

  const exists = await model.findOne({ isSuperadmin: true });
  if (exists) return;

  const passwordHash = await bcrypt.hash(superadminPassword, 12);

  await model.create({
    email: superadminEmail,
    password: passwordHash,
    name: 'Super Administrator',
    status: 'ACTIVE',
    isSuperadmin: true,
    permVersion: 1,
    roleIds: [],
    onBoardingCompleted: true,
  });
}
