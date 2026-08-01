import { CreateBookingUseCase } from './create-booking.use-case';
import { RoomConflictException } from '@/domains/booking-room/domain/exceptions/room-conflict.exception';
import { InvalidTimeRangeException } from '@/domains/booking-room/domain/exceptions/invalid-time-range.exception';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;
  let mockRepo: any;
  let mockLockService: any;
  let mockConnection: any;

  const baseDto = {
    roomIds: ['room_1'],
    title: 'Sprint Planning',
    departmentIds: ['dept_1'],
    participantIds: ['p_1', 'p_2'],
    startTime: '2026-07-10T09:00:00.000Z',
    endTime: '2026-07-10T10:00:00.000Z',
    note: 'notes',
    jpTitle: 'スプリント計画',
    jpNote: 'メモ',
  };

  beforeEach(() => {
    mockRepo = {
      findActiveBookingsInDateRange: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (booking: BookingEntity, session?: any) => booking),
    };
    mockLockService = {
      runExclusive: jest.fn((cb: () => Promise<any>) => cb()),
    };
    mockConnection = {
      transaction: jest.fn((cb: (session: any) => Promise<any>) => {
        const session = { fake: true };
        return cb(session);
      }),
    };
    useCase = new CreateBookingUseCase(mockRepo, mockLockService, mockConnection);
  });

  it('throws InvalidTimeRangeException when endTime <= startTime', async () => {
    await expect(
      useCase.execute({
        data: { ...baseDto, startTime: '2026-07-10T10:00:00.000Z', endTime: '2026-07-10T09:00:00.000Z' } as any,
        creatorId: 'creator_1',
      }),
    ).rejects.toBeInstanceOf(InvalidTimeRangeException);
  });

  it('throws RoomConflictException when an overlapping booking exists for the room', async () => {
    mockRepo.findActiveBookingsInDateRange.mockResolvedValueOnce([
      BookingEntity.create('booking_x', {
        roomIds: ['room_1'],
        title: 'Other',
        departmentIds: [],
        participantIds: [],
        conflictedUsers: [],
        creatorId: 'c2',
        startTime: new Date('2026-07-10T09:30:00.000Z'),
        endTime: new Date('2026-07-10T10:30:00.000Z'),
        note: '',
        jpTitle: '',
        jpNote: '',
        status: BookingStatus.SCHEDULED,
        isDeleted: false,
        deletedAt: null,
        history: [],
        version: 0,
      }),
    ]);

    await expect(
      useCase.execute({ data: baseDto as any, creatorId: 'creator_1' }),
    ).rejects.toBeInstanceOf(RoomConflictException);
  });

  it('persists jpTitle and jpNote on the saved booking', async () => {
    const saved = await useCase.execute({ data: baseDto as any, creatorId: 'creator_1' });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const savedEntity: BookingEntity = mockRepo.save.mock.calls[0][0];
    expect(savedEntity.jpTitle).toBe('スプリント計画');
    expect(savedEntity.jpNote).toBe('メモ');
    expect(saved).toMatchObject({
      jpTitle: 'スプリント計画',
      jpNote: 'メモ',
      title: 'Sprint Planning',
      status: BookingStatus.SCHEDULED,
    });
  });

  it('defaults jpTitle/jpNote to empty strings when not provided', async () => {
    const { jpTitle, jpNote, ...dtoWithoutJp } = baseDto;
    void jpTitle; void jpNote;
    const saved = await useCase.execute({ data: dtoWithoutJp as any, creatorId: 'creator_1' });
    expect(saved).toMatchObject({ jpTitle: '', jpNote: '' });
  });

  it('records participant conflicts as a non-blocking warning (conflictedUsers)', async () => {
    mockRepo.findActiveBookingsInDateRange
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        BookingEntity.create('booking_y', {
          roomIds: ['room_2'],
          title: 'Other meeting',
          departmentIds: [],
          participantIds: ['p_1'],
          conflictedUsers: [],
          creatorId: 'c2',
          startTime: new Date('2026-07-10T09:30:00.000Z'),
          endTime: new Date('2026-07-10T10:30:00.000Z'),
          note: '',
          jpTitle: '',
          jpNote: '',
          status: BookingStatus.SCHEDULED,
          isDeleted: false,
          deletedAt: null,
          history: [],
          version: 0,
        }),
      ]);

    const saved = await useCase.execute({ data: baseDto as any, creatorId: 'creator_1' });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(saved).toMatchObject({ conflictedUsers: ['p_1'] });
  });

  it('wraps execution in lock and transaction', async () => {
    await useCase.execute({ data: baseDto as any, creatorId: 'creator_1' });

    expect(mockLockService.runExclusive).toHaveBeenCalledTimes(1);
    expect(mockConnection.transaction).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const saveCallArgs = mockRepo.save.mock.calls[0];
    expect(saveCallArgs[1]).toEqual({ fake: true });
  });

  it('initializes version to 0 on saved booking', async () => {
    const saved = await useCase.execute({ data: baseDto as any, creatorId: 'creator_1' });
    const savedEntity: BookingEntity = mockRepo.save.mock.calls[0][0];
    expect(savedEntity.version).toBe(0);
    expect(saved.version).toBe(0);
  });
});
