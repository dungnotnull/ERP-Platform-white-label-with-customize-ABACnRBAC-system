import { UpdateBookingUseCase } from './update-booking.use-case';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';
import { BookingNotFoundException } from '@/domains/booking-room/domain/exceptions/booking-not-found.exception';
import { BookingConcurrentModificationException } from '@/domains/booking-room/domain/exceptions/booking-concurrent-modification.exception';
import { RoomConflictException } from '@/domains/booking-room/domain/exceptions/room-conflict.exception';

const buildEntity = (version: number): BookingEntity => {
  return BookingEntity.create('booking_1', {
    roomIds: ['room_1'],
    title: 'Original',
    departmentIds: [],
    participantIds: ['p_1'],
    conflictedUsers: [],
    creatorId: 'creator_1',
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

describe('UpdateBookingUseCase', () => {
  let useCase: UpdateBookingUseCase;
  let mockRepo: any;
  let mockLockService: any;
  let mockConnection: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findActiveBookingsInDateRange: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (b: BookingEntity) => b),
    };
    mockLockService = {
      runExclusive: jest.fn((cb: () => Promise<any>) => cb()),
    };
    mockConnection = {
      transaction: jest.fn((cb: (s: any) => Promise<any>) => cb({ fake: true })),
    };
    useCase = new UpdateBookingUseCase(mockRepo, mockLockService, mockConnection);
  });

  it('throws BookingNotFoundException when booking does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({
        id: 'booking_1',
        data: { expectedVersion: 0 } as any,
        actorId: 'user_1',
      }),
    ).rejects.toBeInstanceOf(BookingNotFoundException);
  });

  it('throws BookingConcurrentModificationException when expectedVersion mismatches', async () => {
    mockRepo.findById.mockResolvedValue(buildEntity(5));
    await expect(
      useCase.execute({
        id: 'booking_1',
        data: { title: 'Updated', expectedVersion: 3 } as any,
        actorId: 'user_1',
      }),
    ).rejects.toBeInstanceOf(BookingConcurrentModificationException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('throws RoomConflictException when target room is occupied', async () => {
    mockRepo.findById.mockResolvedValue(buildEntity(0));
    mockRepo.findActiveBookingsInDateRange.mockResolvedValue([
      BookingEntity.create('booking_other', {
        roomIds: ['room_1'],
        title: 'Other',
        departmentIds: [],
        participantIds: [],
        conflictedUsers: [],
        creatorId: 'other',
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
      useCase.execute({
        id: 'booking_1',
        data: { title: 'Updated', expectedVersion: 0 } as any,
        actorId: 'user_1',
      }),
    ).rejects.toBeInstanceOf(RoomConflictException);
  });

  it('updates successfully when expectedVersion matches', async () => {
    const entity = buildEntity(0);
    mockRepo.findById.mockResolvedValue(entity);
    const result = await useCase.execute({
      id: 'booking_1',
      data: { title: 'Updated', expectedVersion: 0 } as any,
      actorId: 'user_1',
    });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const saveArgs = mockRepo.save.mock.calls[0];
    expect(saveArgs[2]).toBe(0);
    expect(result.title).toBe('Updated');
  });

  it('wraps execution in lock and transaction', async () => {
    mockRepo.findById.mockResolvedValue(buildEntity(0));
    await useCase.execute({
      id: 'booking_1',
      data: { title: 'Updated', expectedVersion: 0 } as any,
      actorId: 'user_1',
    });
    expect(mockLockService.runExclusive).toHaveBeenCalledTimes(1);
    expect(mockConnection.transaction).toHaveBeenCalledTimes(1);
  });
});
