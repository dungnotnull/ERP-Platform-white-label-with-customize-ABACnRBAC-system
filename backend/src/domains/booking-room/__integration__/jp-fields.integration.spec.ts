import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Booking, BookingSchema } from '@/domains/booking-room/infrastructure/persistence/schemas/booking.schema';
import { MeetingRoom, MeetingRoomSchema } from '@/domains/booking-room/infrastructure/persistence/schemas/meeting-room.schema';
import { BookingRepository } from '@/domains/booking-room/infrastructure/persistence/repositories/booking.repository';
import { RoomRepository } from '@/domains/booking-room/infrastructure/persistence/repositories/room.repository';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import { MeetingRoomEntity } from '@/domains/booking-room/domain/entities/meeting-room.entity';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

describe('JP fields persistence (integration)', () => {
  let mongod: MongoMemoryServer;
  let connection: mongoose.Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongod.getUri(), { autoIndex: true }).asPromise();
    // Register schemas required by .populate('departmentIds') inside BookingRepository
    connection.model('Department', new mongoose.Schema({ nameVi: String, nameJa: String }));
    connection.model('InternalUser', new mongoose.Schema({ displayName: String }));
  }, 60000);

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  describe('booking jpTitle / jpNote round-trip', () => {
    let bookingRepo: BookingRepository;

    beforeAll(async () => {
      const model: any = connection.model(Booking.name, BookingSchema);
      bookingRepo = new BookingRepository(model);
    });

    it('saves and retrieves jpTitle and jpNote', async () => {
      const id = new Types.ObjectId().toString();
      const booking = BookingEntity.create(id, {
        roomIds: [new Types.ObjectId().toString()],
        title: 'Daily Standup',
        jpTitle: '\u30C7\u30A4\u30EA\u30FC\u30B9\u30BF\u30F3\u30C9\u30A2\u30C3\u30D7',
        departmentIds: [],
        participantIds: [],
        conflictedUsers: [],
        creatorId: new Types.ObjectId().toString(),
        startTime: new Date('2026-07-10T09:00:00.000Z'),
        endTime: new Date('2026-07-10T09:30:00.000Z'),
        note: 'note',
        jpNote: '\u30E1\u30E2',
        status: BookingStatus.SCHEDULED,
        isDeleted: false,
        deletedAt: null,
        history: [],
        version: 0,
      });

      await bookingRepo.save(booking);

      const found = await bookingRepo.findById(id);
      expect(found).not.toBeNull();
      expect(found!.jpTitle).toBe('\u30C7\u30A4\u30EA\u30FC\u30B9\u30BF\u30F3\u30C9\u30A2\u30C3\u30D7');
      expect(found!.jpNote).toBe('\u30E1\u30E2');
      expect(found!.title).toBe('Daily Standup');
    });

    it('timeline search matches both the EN title and the JP title', async () => {
      const id = new Types.ObjectId().toString();
      const booking = BookingEntity.create(id, {
        roomIds: [new Types.ObjectId().toString()],
        title: 'Quarterly Review',
        jpTitle: '\u56DB\u534A\u671F\u30EC\u30D3\u30E5\u30FC',
        departmentIds: [],
        participantIds: [],
        conflictedUsers: [],
        creatorId: new Types.ObjectId().toString(),
        startTime: new Date('2026-07-11T09:00:00.000Z'),
        endTime: new Date('2026-07-11T10:00:00.000Z'),
        note: '',
        jpNote: '',
        status: BookingStatus.SCHEDULED,
        isDeleted: false,
        deletedAt: null,
        history: [],
        version: 0,
      });
      await bookingRepo.save(booking);

      const start = new Date('2026-07-11T00:00:00.000Z');
      const end = new Date('2026-07-11T23:59:59.000Z');

      const byEn = await bookingRepo.findActiveBookingsInDateRange(start, end, { search: 'Quarterly' });
      expect(byEn.map((b) => b.id)).toContain(id);

      const byJp = await bookingRepo.findActiveBookingsInDateRange(start, end, { search: '\u30EC\u30D3\u30E5\u30FC' });
      expect(byJp.map((b) => b.id)).toContain(id);

      const none = await bookingRepo.findActiveBookingsInDateRange(start, end, { search: 'nonexistent-xyz' });
      expect(none.map((b) => b.id)).not.toContain(id);
    });
  });

  describe('meeting room jpName round-trip', () => {
    let roomRepo: RoomRepository;

    beforeAll(async () => {
      const model: any = connection.model(MeetingRoom.name, MeetingRoomSchema);
      roomRepo = new RoomRepository(model);
    });

    it('saves and retrieves jpName, and search matches jpName', async () => {
      const id = new Types.ObjectId().toString();
      const room = MeetingRoomEntity.create(id, {
        name: 'Conference Room A',
        jpName: '\u4F1A\u8B70\u5BA4A',
        capacity: 20,
        description: '',
        isActive: true,
      });

      await roomRepo.save(room);

      const found = await roomRepo.findById(id);
      expect(found).not.toBeNull();
      expect(found!.jpName).toBe('\u4F1A\u8B70\u5BA4A');
      expect(found!.name).toBe('Conference Room A');

      const byJp = await roomRepo.findAll({ isActive: true, search: '\u4F1A\u8B70\u5BA4' });
      expect(byJp.map((r) => r.jpName)).toContain('\u4F1A\u8B70\u5BA4A');
    });
  });
});
