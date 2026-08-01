import mongoose, { Types } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Booking, BookingSchema } from '@/domains/booking-room/infrastructure/persistence/schemas/booking.schema';
import { BookingRepository } from '@/domains/booking-room/infrastructure/persistence/repositories/booking.repository';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';
import { BookingConcurrentModificationException } from '@/domains/booking-room/domain/exceptions/booking-concurrent-modification.exception';

const buildEntity = (id: string, version: number): BookingEntity => {
  return BookingEntity.create(id, {
    roomIds: [new Types.ObjectId().toString()],
    title: 'Test',
    departmentIds: [],
    participantIds: [],
    conflictedUsers: [],
    creatorId: new Types.ObjectId().toString(),
    startTime: new Date('2026-07-10T09:00:00.000Z'),
    endTime: new Date('2026-07-10T10:00:00.000Z'),
    note: '',
    jpTitle: '',
    jpNote: '',
    status: BookingStatus.SCHEDULED,
    isDeleted: false,
    deletedAt: null,
    history: [],
    version,
  });
};

describe('BookingRepository save() with version', () => {
  let replSet: MongoMemoryReplSet;
  let model: mongoose.Model<any>;
  let repository: BookingRepository;
  let actorId: string;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
    model = mongoose.model(Booking.name, BookingSchema);
    repository = new BookingRepository(model);
    actorId = new Types.ObjectId().toString();
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  });

  afterEach(async () => {
    await model.deleteMany({});
  });

  it('creates a new booking with version 0 when no expectedVersion provided', async () => {
    const id = new Types.ObjectId().toString();
    const entity = buildEntity(id, 0);
    const saved = await repository.save(entity);
    expect(saved.version).toBe(0);

    const doc = (await model.findById(id).lean()) as { version?: number } | null;
    expect(doc?.version).toBe(0);
  });

  it('updates successfully when expectedVersion matches', async () => {
    const id = new Types.ObjectId().toString();
    const entity = buildEntity(id, 0);
    await repository.save(entity);

    entity.modifyDetails({ title: 'Updated' }, actorId);
    const updated = await repository.save(entity, undefined, 0);
    expect(updated.version).toBe(1);
    expect(updated.title).toBe('Updated');
  });

  it('updates legacy booking without version field when expectedVersion is 0', async () => {
    const id = new Types.ObjectId().toString();
    const entity = buildEntity(id, 0);
    await repository.save(entity);
    await model.updateOne({ _id: new Types.ObjectId(id) }, { $unset: { version: '' } });

    entity.modifyDetails({ title: 'Legacy Updated' }, actorId);
    const updated = await repository.save(entity, undefined, 0);

    expect(updated.version).toBe(1);
    expect(updated.title).toBe('Legacy Updated');

    const doc = (await model.findById(id).lean()) as { version?: number } | null;
    expect(doc?.version).toBe(1);
  });

  it('throws BookingConcurrentModificationException when expectedVersion mismatches', async () => {
    const id = new Types.ObjectId().toString();
    const entity = buildEntity(id, 0);
    await repository.save(entity);

    entity.modifyDetails({ title: 'Updated' }, actorId);
    await repository.save(entity, undefined, 0);

    entity.modifyDetails({ title: 'Updated Again' }, actorId);
    await expect(repository.save(entity, undefined, 0)).rejects.toBeInstanceOf(
      BookingConcurrentModificationException,
    );
  });

  it('participates in a transaction (rollback on throw)', async () => {
    const id = new Types.ObjectId().toString();
    const entity = buildEntity(id, 0);
    await repository.save(entity);

    const session = await mongoose.startSession();
    await expect(
      session.withTransaction(async (s) => {
        entity.modifyDetails({ title: 'In Txn' }, actorId);
        await repository.save(entity, s, 0);
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');
    await session.endSession();

    const doc = (await model.findById(id).lean()) as { title?: string; version?: number } | null;
    expect(doc?.title).toBe('Test');
    expect(doc?.version).toBe(0);
  });
});
