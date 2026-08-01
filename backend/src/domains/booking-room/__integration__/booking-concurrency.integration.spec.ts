import mongoose, { Types } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Booking, BookingSchema } from '@/domains/booking-room/infrastructure/persistence/schemas/booking.schema';
import { MeetingRoom, MeetingRoomSchema } from '@/domains/booking-room/infrastructure/persistence/schemas/meeting-room.schema';
import { BookingRepository } from '@/domains/booking-room/infrastructure/persistence/repositories/booking.repository';
import { BookingMutationLockService } from '@/domains/booking-room/application/services/booking-mutation-lock.service';
import { CreateBookingUseCase } from '@/domains/booking-room/application/use-cases/booking/create-booking.use-case';
import { UpdateBookingUseCase } from '@/domains/booking-room/application/use-cases/booking/update-booking.use-case';
import { DeleteBookingUseCase } from '@/domains/booking-room/application/use-cases/booking/delete-booking.use-case';
import { RoomConflictException } from '@/domains/booking-room/domain/exceptions/room-conflict.exception';
import { BookingConcurrentModificationException } from '@/domains/booking-room/domain/exceptions/booking-concurrent-modification.exception';

const iso = (h: number) => new Date(Date.UTC(2026, 6, 10, h, 0, 0)).toISOString();
const user1 = new Types.ObjectId().toString();
const user2 = new Types.ObjectId().toString();

describe('Booking concurrency', () => {
  let replSet: MongoMemoryReplSet;
  let connection: mongoose.Connection;
  let bookingModel: mongoose.Model<any>;
  let roomModel: mongoose.Model<any>;
  let repository: BookingRepository;
  let lockService: BookingMutationLockService;
  let createUseCase: CreateBookingUseCase;
  let updateUseCase: UpdateBookingUseCase;
  let deleteUseCase: DeleteBookingUseCase;

  const roomA = new Types.ObjectId().toString();
  const roomB = new Types.ObjectId().toString();

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri(), { autoIndex: true }).asPromise();
    connection.model('Department', new mongoose.Schema({ nameVi: String, nameJa: String }));
    connection.model('InternalUser', new mongoose.Schema({ displayName: String }));
    bookingModel = connection.model(Booking.name, BookingSchema);
    roomModel = connection.model(MeetingRoom.name, MeetingRoomSchema);
    await roomModel.create({ _id: roomA, name: 'Room A', capacity: 8, isActive: true });
    await roomModel.create({ _id: roomB, name: 'Room B', capacity: 8, isActive: true });

    repository = new BookingRepository(bookingModel);
    lockService = new BookingMutationLockService();
    createUseCase = new CreateBookingUseCase(repository, lockService, connection);
    updateUseCase = new UpdateBookingUseCase(repository, lockService, connection);
    deleteUseCase = new DeleteBookingUseCase(repository, lockService, connection);
  }, 60000);

  afterAll(async () => {
    await connection.close();
    await replSet.stop();
  });

  afterEach(async () => {
    await bookingModel.deleteMany({});
  });

  it('prevents two concurrent creates for the same room slot', async () => {
    const results = await Promise.allSettled([
      createUseCase.execute({
        data: {
          roomIds: [roomA],
          title: 'A1',
          departmentIds: [],
          participantIds: [],
          startTime: iso(10),
          endTime: iso(11),
        } as any,
        creatorId: user1,
      }),
      createUseCase.execute({
        data: {
          roomIds: [roomA],
          title: 'A2',
          departmentIds: [],
          participantIds: [],
          startTime: iso(10),
          endTime: iso(11),
        } as any,
        creatorId: user2,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(RoomConflictException);
  });

  it('serializes update-releases-room + create-takes-room (both succeed)', async () => {
    const created = await createUseCase.execute({
      data: {
        roomIds: [roomA],
        title: 'Original',
        departmentIds: [],
        participantIds: [],
        startTime: iso(10),
        endTime: iso(11),
      } as any,
      creatorId: user1,
    });
    const bookingId = created.id as string;
    const initialVersion = created.version as number;

    const results = await Promise.allSettled([
      updateUseCase.execute({
        id: bookingId,
        data: {
          roomIds: [roomB],
          expectedVersion: initialVersion,
        } as any,
        actorId: user1,
      }),
      createUseCase.execute({
        data: {
          roomIds: [roomA],
          title: 'New on A',
          departmentIds: [],
          participantIds: [],
          startTime: iso(10),
          endTime: iso(11),
        } as any,
        creatorId: user2,
      }),
    ]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    const finalState = (await bookingModel.findById(bookingId).lean()) as { roomIds: any[] } | null;
    expect(finalState?.roomIds.map((r: any) => r.toString())).toEqual([roomB]);
  });

  it('rejects concurrent updates on the same booking via version mismatch', async () => {
    const created = await createUseCase.execute({
      data: {
        roomIds: [roomA],
        title: 'Original',
        departmentIds: [],
        participantIds: [],
        startTime: iso(10),
        endTime: iso(11),
      } as any,
      creatorId: user1,
    });
    const bookingId = created.id as string;
    const initialVersion = created.version as number;

    const results = await Promise.allSettled([
      updateUseCase.execute({
        id: bookingId,
        data: { title: 'Edit A', expectedVersion: initialVersion } as any,
        actorId: user1,
      }),
      updateUseCase.execute({
        id: bookingId,
        data: { title: 'Edit B', expectedVersion: initialVersion } as any,
        actorId: user2,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      BookingConcurrentModificationException,
    );
  });

  it('serializes concurrent delete and update on the same booking', async () => {
    const created = await createUseCase.execute({
      data: {
        roomIds: [roomA],
        title: 'Original',
        departmentIds: [],
        participantIds: [],
        startTime: iso(10),
        endTime: iso(11),
      } as any,
      creatorId: user1,
    });
    const bookingId = created.id as string;
    const initialVersion = created.version as number;

    const results = await Promise.allSettled([
      deleteUseCase.execute({ id: bookingId, expectedVersion: initialVersion, actorId: user1 }),
      updateUseCase.execute({
        id: bookingId,
        data: { title: 'Edit', expectedVersion: initialVersion } as any,
        actorId: user2,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(
      rejectedReason instanceof BookingConcurrentModificationException ||
        rejectedReason.constructor.name === 'BookingAlreadyDeletedException',
    ).toBe(true);
  });
});
