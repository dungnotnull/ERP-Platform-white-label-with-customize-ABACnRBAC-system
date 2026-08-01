import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '@/app.module';
import { Types } from 'mongoose';
import * as _ from 'lodash';
import { Roles } from '@/shared/domain/enums/role.enum';

const logger = new Logger('Seed');

const PERMISSIONS_DATA = [
  { name: 'VIEW_ALL_TEAMS', description: 'View all teams' },
  { name: 'VIEW_TEAM', description: 'View team details' },
  { name: 'CREATE_TEAM', description: 'Create a new team' },
  { name: 'DELETE_TEAM', description: 'Delete a team' },
  { name: 'EDIT_TEAM', description: 'Edit team details' },
  { name: 'VIEW_ALL_USERS', description: 'View all users' },
  { name: 'CREATE_USER', description: 'Create a new user' },
  { name: 'DELETE_USER', description: 'Delete a user' },
  { name: 'EDIT_USER', description: 'Edit user details' },
  { name: 'VIEW_ALL_ROLES', description: 'View all roles' },
  { name: 'CHANGE_USER_ROLE', description: 'Change user role assignments' },
  { name: 'MANAGE_PERMISSIONS', description: 'Manage permission definitions' },
  { name: 'VIEW_ALL_MEMBERS', description: 'View all members' },
  { name: 'ADD_MEMBER', description: 'Add a member to a team' },
  { name: 'REMOVE_MEMBER', description: 'Remove a member from a team' },
  { name: 'VIEW_ALL_PROJECTS', description: 'View all projects' },
  { name: 'VIEW_PROJECT', description: 'View project details' },
  { name: 'CREATE_PROJECT', description: 'Create a new project' },
  { name: 'DELETE_PROJECT', description: 'Delete a project' },
  { name: 'EDIT_PROJECT', description: 'Edit project details' },
  { name: 'CREATE_TASK', description: 'Create a new task' },
  { name: 'DELETE_TASK', description: 'Delete a task' },
  { name: 'EDIT_TASK', description: 'Edit task details' },
  { name: 'VIEW_ONLY', description: 'Read-only access' },
  { name: 'MANAGE_DEVICES', description: 'Manage device assets' },
  { name: 'MANAGE_DEVICE_REQUESTS', description: 'Manage device requests' },
  { name: 'MANAGE_ORGANIZATION', description: 'Manage organization settings' },
];

const DEVICE_TYPES_DATA = [
  { name: 'Laptop', description: 'Portable computers', isActive: true },
  { name: 'Desktop', description: 'Desktop computers', isActive: true },
  { name: 'Mobile', description: 'Mobile phones and tablets', isActive: true },
  { name: 'Tablet', description: 'Tablet devices', isActive: true },
];

const DEVICE_STATUSES_DATA = [
  {
    name: 'available',
    description: 'Device is available for assignment',
    isActive: true,
  },
  {
    name: 'handed_over',
    description: 'Device is currently assigned',
    isActive: true,
  },
  {
    name: 'usable',
    description: 'Device is usable but not assigned',
    isActive: true,
  },
  {
    name: 'maintenance',
    description: 'Device is under maintenance',
    isActive: true,
  },
  {
    name: 'disposed',
    description: 'Device has been disposed',
    isActive: true,
  },
];

const SUPERADMIN_PERMS = _.map(PERMISSIONS_DATA, 'name');

const ADMIN_PERMS = _.filter(
  SUPERADMIN_PERMS,
  (name) => name !== 'MANAGE_PERMISSIONS',
);

const MANAGER_PERMS = [
  'VIEW_ALL_TEAMS',
  'VIEW_TEAM',
  'VIEW_ALL_USERS',
  'VIEW_ALL_MEMBERS',
  'ADD_MEMBER',
  'REMOVE_MEMBER',
  'VIEW_ALL_PROJECTS',
  'VIEW_PROJECT',
  'CREATE_PROJECT',
  'EDIT_PROJECT',
  'CREATE_TASK',
  'EDIT_TASK',
  'VIEW_ONLY',
  'MANAGE_DEVICES',
  'MANAGE_DEVICE_REQUESTS',
  'MANAGE_ORGANIZATION',
];

const LEADER_PERMS = [
  'VIEW_ALL_TEAMS',
  'VIEW_TEAM',
  'VIEW_ALL_USERS',
  'VIEW_ALL_MEMBERS',
  'VIEW_ALL_PROJECTS',
  'VIEW_PROJECT',
  'CREATE_TASK',
  'EDIT_TASK',
  'VIEW_ONLY',
];

const MEMBER_PERMS = ['VIEW_ONLY'];

interface PermissionDoc {
  _id: Types.ObjectId;
  name: string;
}

interface RoleDoc {
  _id: Types.ObjectId;
  name: string;
}

interface UserDoc {
  _id: Types.ObjectId;
  email: string;
}

async function seedPermissions(
  PermissionModel: any,
): Promise<Map<string, Types.ObjectId>> {
  const existing = await PermissionModel.find({}).lean();
  if (!_.isEmpty(existing)) {
    logger.log(`Permissions already seeded (${existing.length} found), skipping`);
    const map = new Map<string, Types.ObjectId>();
    _.forEach(existing, (p: PermissionDoc) => map.set(p.name, p._id));
    return map;
  }

  const docs = _.map(PERMISSIONS_DATA, (p) => ({
    ...p,
    status: 'ACTIVE',
    createdBy: 'system',
  }));

  const created = await PermissionModel.insertMany(docs);
  const map = new Map<string, Types.ObjectId>();
  _.forEach(created, (p: PermissionDoc) => map.set(p.name, p._id));
  logger.log(`Seeded ${created.length} permissions`);
  return map;
}

async function seedRoles(
  RoleModel: any,
  permissionMap: Map<string, Types.ObjectId>,
): Promise<Map<string, Types.ObjectId>> {
  const existing = await RoleModel.find({}).lean();
  if (!_.isEmpty(existing)) {
    logger.log(`Roles already seeded (${existing.length} found), skipping`);
    const map = new Map<string, Types.ObjectId>();
    _.forEach(existing, (r: RoleDoc) => map.set(r.name, r._id));
    return map;
  }

  const rolesData = [
    {
      name: Roles.SUPERADMIN,
      description: 'Full system access with all permissions',
      permissions: _.map(SUPERADMIN_PERMS, (name) => permissionMap.get(name)),
      status: 'ACTIVE',
    },
    {
      name: Roles.ADMIN,
      description: 'Administrative access, cannot manage permissions',
      permissions: _.map(ADMIN_PERMS, (name) => permissionMap.get(name)),
      status: 'ACTIVE',
    },
    {
      name: Roles.MANAGER,
      description: 'Team and project management access',
      permissions: _.map(MANAGER_PERMS, (name) => permissionMap.get(name)),
      status: 'ACTIVE',
    },
    {
      name: Roles.LEADER,
      description: 'Team leader with limited project access',
      permissions: _.map(LEADER_PERMS, (name) => permissionMap.get(name)),
      status: 'ACTIVE',
    },
    {
      name: Roles.MEMBER,
      description: 'Basic member with read-only access',
      permissions: _.map(MEMBER_PERMS, (name) => permissionMap.get(name)),
      status: 'ACTIVE',
    },
  ];

  const created = await RoleModel.insertMany(rolesData);
  const map = new Map<string, Types.ObjectId>();
  _.forEach(created, (r: RoleDoc) => map.set(r.name, r._id));
  logger.log(`Seeded ${created.length} roles`);
  return map;
}

async function seedAdminUser(
  UserModel: any,
  roleMap: Map<string, Types.ObjectId>,
): Promise<Types.ObjectId | null> {
  const adminEmail =
    process.env.ADMIN_EMAIL || 'admin@example.com';

  const existing = await UserModel.findOne({ email: adminEmail }).lean();
  if (existing) {
    logger.log(`Admin user already exists (${adminEmail}), skipping`);
    return existing._id;
  }

  const adminRoleId = roleMap.get(Roles.ADMIN);
  if (!adminRoleId) {
    logger.error('ADMIN role not found in role map. Cannot seed admin user.');
    return null;
  }

  const rawPassword = process.env.ADMIN_PASSWORD;
  if (!rawPassword) {
    throw new Error(
      'ADMIN_PASSWORD env var is required to seed the admin user',
    );
  }

  const admin = await UserModel.create({
    name: 'System Admin',
    email: adminEmail,
    password: rawPassword,
    status: 'ACTIVE',
    onBoardingCompleted: true,
    roleIds: [adminRoleId],
    createdBy: 'system',
  });

  logger.log(`Seeded admin user: ${adminEmail}`);
  return admin._id;
}

async function seedAdminAccount(
  AccountModel: any,
  adminUserId: Types.ObjectId | null,
): Promise<void> {
  if (!adminUserId) return;

  const adminEmail =
    process.env.ADMIN_EMAIL || 'admin@example.com';

  const existing = await AccountModel.findOne({
    userId: adminUserId,
    provider: 'EMAIL',
  }).lean();
  if (existing) {
    logger.log('Admin account already exists, skipping');
    return;
  }

  await AccountModel.create({
    userId: adminUserId,
    provider: 'EMAIL',
    providerId: adminEmail,
  });

  logger.log('Seeded admin account');
}

async function seedDeviceTypes(DeviceTypeModel: any): Promise<void> {
  const existing = await DeviceTypeModel.find({}).lean();
  if (!_.isEmpty(existing)) {
    logger.log(
      `Device types already seeded (${existing.length} found), skipping`,
    );
    return;
  }

  const created = await DeviceTypeModel.insertMany(DEVICE_TYPES_DATA);
  logger.log(`Seeded ${created.length} device types`);
}

async function seedDeviceStatuses(DeviceStatusModel: any): Promise<void> {
  const existing = await DeviceStatusModel.find({}).lean();
  if (!_.isEmpty(existing)) {
    logger.log(
      `Device statuses already seeded (${existing.length} found), skipping`,
    );
    return;
  }

  const created = await DeviceStatusModel.insertMany(DEVICE_STATUSES_DATA);
  logger.log(`Seeded ${created.length} device statuses`);
}

async function seedAllowedOrigins(AllowedOriginModel: any): Promise<void> {
  const originsRaw = process.env.CORS_ORIGINS;
  if (!originsRaw) {
    logger.log('No CORS_ORIGINS env var set, skipping allowed origins');
    return;
  }

  const origins = _.map(_.split(originsRaw, ','), (s) => _.trim(s));
  const validOrigins = _.filter(origins, (s) => !_.isEmpty(s));

  if (_.isEmpty(validOrigins)) {
    logger.log('No valid origins found in CORS_ORIGINS, skipping');
    return;
  }

  const existing = await AllowedOriginModel.find({
    origin: { $in: validOrigins },
  }).lean();
  const existingNames = new Set(_.map(existing, 'origin'));

  const newOrigins = _.filter(
    validOrigins,
    (origin) => !existingNames.has(origin),
  );

  if (_.isEmpty(newOrigins)) {
    logger.log('All allowed origins already exist, skipping');
    return;
  }

  const docs = _.map(newOrigins, (origin) => ({
    origin,
    isActive: true,
    description: 'Seeded from CORS_ORIGINS',
  }));

  await AllowedOriginModel.insertMany(docs);
  logger.log(`Seeded ${docs.length} allowed origins`);
}

async function bootstrap(): Promise<void> {
  logger.log('Starting database seeding...');

  const appContext = await NestFactory.createApplicationContext(AppModule);

  try {
    const PermissionModel = appContext.get(
      getModelToken('Permission'),
    );
    const RoleModel = appContext.get(getModelToken('Role'));
    const UserModel = appContext.get(getModelToken('User'));
    const AccountModel = appContext.get(getModelToken('Account'));
    const DeviceTypeModel = appContext.get(getModelToken('DeviceType'));
    const DeviceStatusModel = appContext.get(
      getModelToken('DeviceStatus'),
    );
    const AllowedOriginModel = appContext.get(
      getModelToken('AllowedOrigin'),
    );
    logger.log('--- Seeding permissions ---');
    const permissionMap = await seedPermissions(PermissionModel);

    logger.log('--- Seeding roles ---');
    const roleMap = await seedRoles(RoleModel, permissionMap);

    logger.log('--- Seeding admin user ---');
    const adminUserId = await seedAdminUser(UserModel, roleMap);

    logger.log('--- Seeding admin account ---');
    await seedAdminAccount(AccountModel, adminUserId);

    logger.log('--- Seeding device types ---');
    await seedDeviceTypes(DeviceTypeModel);

    logger.log('--- Seeding device statuses ---');
    await seedDeviceStatuses(DeviceStatusModel);

    logger.log('--- Seeding allowed origins ---');
    await seedAllowedOrigins(AllowedOriginModel);

    logger.log('Database seeding completed successfully');
    logger.log(
      'Next: run `npm run seed:abac` to seed ABAC endpoint permissions and roles.',
    );
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
