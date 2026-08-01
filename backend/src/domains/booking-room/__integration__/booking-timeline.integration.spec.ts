import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Booking, BookingSchema } from '@/domains/booking-room/infrastructure/persistence/schemas/booking.schema';
import { BookingRepository } from '@/domains/booking-room/infrastructure/persistence/repositories/booking.repository';
import { GetTimelineUseCase } from '@/domains/booking-room/application/use-cases/booking/get-timeline.use-case';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const DAY = '2026-07-10';
const iso = (h: number, m = 0) => new Date(Date.UTC(2026, 6, 10, h, m, 0)).toISOString();

interface SeedBooking {
  title: string;
  roomIds: Types.ObjectId[];
  departmentIds: Types.ObjectId[];
  participantIds: Types.ObjectId[];
  conflictedUsers: Types.ObjectId[];
  creatorId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  isDeleted: boolean;
}

describe('Booking Timeline ? Integration (filters)', () => {
  let mongod: MongoMemoryServer;
  let connection: mongoose.Connection;
  let model: any;
  let repository: BookingRepository;
  let useCase: GetTimelineUseCase;

  // Stable object ids for referential fields
  const rooms = {
    r1: new Types.ObjectId(),
    r2: new Types.ObjectId(),
    r3: new Types.ObjectId(),
  };
  const depts = {
    d1: new Types.ObjectId(),
    d2: new Types.ObjectId(),
    d3: new Types.ObjectId(),
  };
  const users = {
    p1: new Types.ObjectId(),
    p2: new Types.ObjectId(),
    p3: new Types.ObjectId(),
    p4: new Types.ObjectId(),
    c1: new Types.ObjectId(),
    c2: new Types.ObjectId(),
    c3: new Types.ObjectId(),
    cu1: new Types.ObjectId(),
    cu2: new Types.ObjectId(),
    cu3: new Types.ObjectId(),
  };

  const SEED: SeedBooking[] = [
    {
      title: 'Daily Standup',
      roomIds: [rooms.r1], departmentIds: [depts.d1],
      participantIds: [users.p1, users.p2], conflictedUsers: [users.cu1], creatorId: users.c1,
      startTime: new Date(iso(9)), endTime: new Date(iso(10)), status: BookingStatus.SCHEDULED, isDeleted: false,
    },
    {
      title: 'Sprint Planning',
      roomIds: [rooms.r2], departmentIds: [depts.d2],
      participantIds: [users.p3], conflictedUsers: [], creatorId: users.c2,
      startTime: new Date(iso(10)), endTime: new Date(iso(11)), status: BookingStatus.SCHEDULED, isDeleted: false,
    },
    {
      title: 'Design Review',
      roomIds: [rooms.r1], departmentIds: [depts.d1],
      participantIds: [users.p1, users.p4], conflictedUsers: [users.cu2], creatorId: users.c1,
      startTime: new Date(iso(11)), endTime: new Date(iso(12)), status: BookingStatus.SCHEDULED, isDeleted: false,
    },
    {
      title: 'Retrospective',
      roomIds: [rooms.r3], departmentIds: [depts.d3],
      participantIds: [users.p2, users.p3], conflictedUsers: [users.cu1, users.cu2], creatorId: users.c3,
      startTime: new Date(iso(13)), endTime: new Date(iso(14)), status: BookingStatus.SCHEDULED, isDeleted: false,
    },
    {
      title: 'Client Sync',
      roomIds: [rooms.r2], departmentIds: [depts.d2],
      participantIds: [users.p4], conflictedUsers: [], creatorId: users.c2,
      startTime: new Date(iso(14)), endTime: new Date(iso(15)), status: BookingStatus.COMPLETED, isDeleted: false,
    },
    {
      title: 'Cancelled Standup',
      roomIds: [rooms.r1], departmentIds: [depts.d1],
      participantIds: [users.p1], conflictedUsers: [], creatorId: users.c1,
      startTime: new Date(iso(15)), endTime: new Date(iso(16)), status: BookingStatus.CANCELLED, isDeleted: true,
    },
    {
      title: 'Architecture Sync',
      roomIds: [rooms.r3], departmentIds: [depts.d3],
      participantIds: [users.p1, users.p2], conflictedUsers: [users.cu3], creatorId: users.c3,
      startTime: new Date(iso(16)), endTime: new Date(iso(17)), status: BookingStatus.SCHEDULED, isDeleted: false,
    },
  ];

  const titles = (result: Record<string, unknown>[]) => result.map((r) => r.title);

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongod.getUri(), { autoIndex: true }).asPromise();
    // Register schemas required by .populate('departmentIds') inside BookingRepository
    connection.model('Department', new mongoose.Schema({ nameVi: String, nameJa: String }));
    connection.model('InternalUser', new mongoose.Schema({ displayName: String }));
    model = connection.model(Booking.name, BookingSchema);
    repository = new BookingRepository(model);
    useCase = new GetTimelineUseCase(repository as any);

    for (const entry of SEED) {
      await model.create(entry);
    }
  }, 60000);

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  const range = { startDate: `${DAY}T00:00:00.000Z`, endDate: `${DAY}T23:59:59.000Z` };

  describe('no filters', () => {
    it('returns all non-cancelled, non-deleted bookings sorted by startTime asc', async () => {
      const result = await useCase.execute(range);
      expect(result).toHaveLength(6);
      expect(titles(result)).toEqual([
        'Daily Standup',
        'Sprint Planning',
        'Design Review',
        'Retrospective',
        'Client Sync',
        'Architecture Sync',
      ]);
    });
  });

  describe('search filter', () => {
    it('matches titles case-insensitively (standup) excluding cancelled', async () => {
      const result = await useCase.execute({ ...range, search: 'standup' });
      expect(titles(result)).toEqual(['Daily Standup']);
    });

    it('matches partial "sync" across multiple bookings', async () => {
      const result = await useCase.execute({ ...range, search: 'sync' });
      expect(titles(result).sort()).toEqual(['Architecture Sync', 'Client Sync']);
    });

    it('returns empty for non-matching search', async () => {
      const result = await useCase.execute({ ...range, search: 'nonexistent-meeting-xyz' });
      expect(result).toEqual([]);
    });
  });

  describe('roomIds filter', () => {
    it('filters by a single room', async () => {
      const result = await useCase.execute({ ...range, roomIds: [rooms.r1.toHexString()] });
      expect(titles(result).sort()).toEqual(['Daily Standup', 'Design Review']);
    });

    it('filters by multiple rooms (OR semantics)', async () => {
      const result = await useCase.execute({
        ...range,
        roomIds: [rooms.r1.toHexString(), rooms.r3.toHexString()],
      });
      expect(titles(result).sort()).toEqual([
        'Architecture Sync',
        'Daily Standup',
        'Design Review',
        'Retrospective',
      ]);
    });
  });

  describe('departmentIds filter', () => {
    it('filters by department', async () => {
      const result = await useCase.execute({ ...range, departmentIds: [depts.d1.toHexString()] });
      expect(titles(result).sort()).toEqual(['Daily Standup', 'Design Review']);
    });

    it('filters by multiple departments', async () => {
      const result = await useCase.execute({
        ...range,
        departmentIds: [depts.d2.toHexString(), depts.d3.toHexString()],
      });
      expect(titles(result).sort()).toEqual([
        'Architecture Sync',
        'Client Sync',
        'Retrospective',
        'Sprint Planning',
      ]);
    });
  });

  describe('participantIds filter', () => {
    it('returns bookings where any participant matches', async () => {
      const result = await useCase.execute({ ...range, participantIds: [users.p1.toHexString()] });
      expect(titles(result).sort()).toEqual(['Architecture Sync', 'Daily Standup', 'Design Review']);
    });

    it('supports multiple participants', async () => {
      const result = await useCase.execute({
        ...range,
        participantIds: [users.p3.toHexString(), users.p4.toHexString()],
      });
      expect(titles(result).sort()).toEqual([
        'Client Sync',
        'Design Review',
        'Retrospective',
        'Sprint Planning',
      ]);
    });
  });

  describe('conflictedUsers filter', () => {
    it('returns bookings that involve a conflicted user', async () => {
      const result = await useCase.execute({ ...range, conflictedUsers: [users.cu1.toHexString()] });
      expect(titles(result).sort()).toEqual(['Daily Standup', 'Retrospective']);
    });

    it('supports multiple conflicted users', async () => {
      const result = await useCase.execute({
        ...range,
        conflictedUsers: [users.cu2.toHexString(), users.cu3.toHexString()],
      });
      expect(titles(result).sort()).toEqual(['Architecture Sync', 'Design Review', 'Retrospective']);
    });
  });

  describe('creatorId filter', () => {
    it('returns bookings created by a given creator', async () => {
      const result = await useCase.execute({ ...range, creatorId: users.c1.toHexString() });
      expect(titles(result).sort()).toEqual(['Daily Standup', 'Design Review']);
    });

    it('returns empty for an unknown creator', async () => {
      const result = await useCase.execute({ ...range, creatorId: new Types.ObjectId().toHexString() });
      expect(result).toEqual([]);
    });
  });

  describe('status filter', () => {
    it('returns only COMPLETED bookings when status=COMPLETED', async () => {
      const result = await useCase.execute({ ...range, status: BookingStatus.COMPLETED });
      expect(titles(result)).toEqual(['Client Sync']);
    });

    it('returns cancelled bookings (including soft-deleted) when status=CANCELLED', async () => {
      const result = await useCase.execute({ ...range, status: BookingStatus.CANCELLED });
      expect(titles(result)).toEqual(['Cancelled Standup']);
    });

    it('returns SCHEDULED bookings when status=SCHEDULED', async () => {
      const result = await useCase.execute({ ...range, status: BookingStatus.SCHEDULED });
      expect(titles(result)).toEqual([
        'Daily Standup',
        'Sprint Planning',
        'Design Review',
        'Retrospective',
        'Architecture Sync',
      ]);
    });
  });

  describe('combined filters', () => {
    it('search + status narrows results', async () => {
      const result = await useCase.execute({
        ...range,
        search: 'standup',
        status: BookingStatus.CANCELLED,
      });
      expect(titles(result)).toEqual(['Cancelled Standup']);
    });

    it('roomIds + departmentIds intersect', async () => {
      const result = await useCase.execute({
        ...range,
        roomIds: [rooms.r3.toHexString()],
        departmentIds: [depts.d3.toHexString()],
      });
      expect(titles(result).sort()).toEqual(['Architecture Sync', 'Retrospective']);
    });

    it('creatorId + status + participantIds combine', async () => {
      const result = await useCase.execute({
        ...range,
        creatorId: users.c3.toHexString(),
        status: BookingStatus.SCHEDULED,
        participantIds: [users.p2.toHexString()],
      });
      // Both Retrospective (p2,p3) and Architecture Sync (p1,p2) are created by
      // c3, scheduled, and include participant p2.
      expect(titles(result).sort()).toEqual(['Architecture Sync', 'Retrospective']);
    });
  });

  describe('date range overlap semantics', () => {
    it('excludes bookings ending exactly at range start', async () => {
      const result = await useCase.execute({
        startDate: `${DAY}T12:00:00.000Z`,
        endDate: `${DAY}T23:59:59.000Z`,
      });
      // Design Review ends at 12:00 (endTime not > start) -> excluded
      expect(titles(result)).not.toContain('Design Review');
      expect(titles(result)).toContain('Retrospective');
    });

    it('excludes bookings starting exactly at range end', async () => {
      const result = await useCase.execute({
        startDate: `${DAY}T00:00:00.000Z`,
        endDate: `${DAY}T13:00:00.000Z`,
      });
      // Retrospective starts at 13:00 (startTime not < end) -> excluded
      expect(titles(result)).not.toContain('Retrospective');
      expect(titles(result)).toContain('Daily Standup');
    });
  });

  describe('output shape', () => {
    it('exposes plain booking fields including conflictedUsers', async () => {
      const result = await useCase.execute({ ...range, search: 'Daily Standup' });
      const item = result[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title', 'Daily Standup');
      expect(item).toHaveProperty('roomIds');
      expect(item).toHaveProperty('departmentIds');
      expect(item).toHaveProperty('participantIds');
      expect(item).toHaveProperty('conflictedUsers');
      expect(item).toHaveProperty('creatorId');
      expect(item).toHaveProperty('status', BookingStatus.SCHEDULED);
      expect((item.conflictedUsers as string[]).length).toBeGreaterThan(0);
    });
  });
});
