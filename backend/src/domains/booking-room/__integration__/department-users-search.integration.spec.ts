import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { InternalUser, InternalUserSchema } from '@/domains/organization/infrastructure/persistence/schemas/internal-user.schema';
import { InternalUserQueryAdapter } from '@/domains/organization/infrastructure/adapters/internal-user-query.adapter';

describe('InternalUserQueryAdapter ? department users search', () => {
  let mongod: MongoMemoryServer;
  let model: any;
  let adapter: InternalUserQueryAdapter;
  let deptA: Types.ObjectId;
  let deptB: Types.ObjectId;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    model = mongoose.model(InternalUser.name, InternalUserSchema);
    adapter = new InternalUserQueryAdapter(model);

    deptA = new Types.ObjectId();
    deptB = new Types.ObjectId();

    const users = [
      { name: 'Nguyen Van An', email: 'an@x.com', employeeCode: 'A001', departmentId: deptA },
      { name: 'Le Thi Binh', email: 'binh@x.com', employeeCode: 'A002', departmentId: deptA },
      { name: 'Tran Tanaka', email: 'tanaka@x.com', employeeCode: 'A003', departmentId: deptA },
      { name: 'Pham Quoc Cuong', email: 'cuong@x.com', employeeCode: 'B001', departmentId: deptB },
      { name: 'Do Deleted', email: 'del@x.com', employeeCode: 'A004', departmentId: deptA, isDeleted: true },
    ];

    for (const u of users) {
      await model.create(u);
    }
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('returns all non-deleted users of a department when no search is provided', async () => {
    const users = await adapter.findByDepartmentId(deptA.toHexString());
    expect(users).toHaveLength(3);
    expect(users.map((u) => u.name).sort()).toEqual(['Le Thi Binh', 'Nguyen Van An', 'Tran Tanaka']);
  });

  it('filters by name case-insensitively (partial match)', async () => {
    const users = await adapter.findByDepartmentId(deptA.toHexString(), 'an');
    const names = users.map((u) => u.name);
    // 'an' appears in 'Nguyen Van An' and 'Tran Tanaka'
    expect(names).toContain('Nguyen Van An');
    expect(names).toContain('Tran Tanaka');
    expect(names).not.toContain('Le Thi Binh');
  });

  it('matches a specific name token', async () => {
    const users = await adapter.findByDepartmentId(deptA.toHexString(), 'Binh');
    expect(users.map((u) => u.name)).toEqual(['Le Thi Binh']);
  });

  it('returns empty when no name matches', async () => {
    const users = await adapter.findByDepartmentId(deptA.toHexString(), 'nonexistent-name-xyz');
    expect(users).toEqual([]);
  });

  it('does not return users from other departments', async () => {
    const users = await adapter.findByDepartmentId(deptA.toHexString(), 'Cuong');
    expect(users).toEqual([]);
  });

  it('excludes soft-deleted users', async () => {
    const users = await adapter.findByDepartmentId(deptA.toHexString(), 'Deleted');
    expect(users).toEqual([]);
  });
});
