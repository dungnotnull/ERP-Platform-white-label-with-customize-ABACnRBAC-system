import { DeleteBookingUseCase } from './delete-booking.use-case';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';
import { BookingNotFoundException } from '@/domains/booking-room/domain/exceptions/booking-not-found.exception';
import { BookingAlreadyDeletedException } from '@/domains/booking-room/domain/exceptions/booking-already-deleted.exception';
import { BookingConcurrentModificationException } from '@/domains/booking-room/domain/exceptions/booking-concurrent-modification.exception';

const buildEntity = (version: number, isDeleted = false): BookingEntity => {
  return BookingEntity.create('booking_1', {
    roomIds: ['room_1'],
    title: 'Original',
    departmentIds: [],
    participantIds: [],
    conflictedUsers: [],
    creatorId: 'creator_1',
    startTime: new Date('2026-07-10T09:00:00.000Z'),
    endTime: new Date('2026-07-10T10:00:00.000Z'),
    note: '',
    jpTitle: '',
    jpNote: '',
    status: isDeleted ? BookingStatus.CANCELLED : BookingStatus.SCHEDULED,
    isDeleted,
    deletedAt: isDeleted ? new Date() : null,
    history: [],
    version,
  });
};

describe('DeleteBookingUseCase', () => {
  let useCase: DeleteBookingUseCase;
  let mockRepo: any;
  let mockLockService: any;
  let mockConnection: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation(async (b: BookingEntity) => b),
    };
    mockLockService = {
      runExclusive: jest.fn((cb: () => Promise<any>) => cb()),
    };
    mockConnection = {
      transaction: jest.fn((cb: (s: any) => Promise<any>) => cb({ fake: true })),
    };
    useCase = new DeleteBookingUseCase(mockRepo, mockLockService, mockConnection);
  });

  it('throws BookingNotFoundException when booking does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ id: 'booking_1', expectedVersion: 0, actorId: 'user_1' }),
    ).rejects.toBeInstanceOf(BookingNotFoundException);
  });

  it('throws BookingConcurrentModificationException when expectedVersion mismatches', async () => {
    mockRepo.findById.mockResolvedValue(buildEntity(5));
    await expect(
      useCase.execute({ id: 'booking_1', expectedVersion: 3, actorId: 'user_1' }),
    ).rejects.toBeInstanceOf(BookingConcurrentModificationException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('throws BookingAlreadyDeletedException when already soft-deleted', async () => {
    mockRepo.findById.mockResolvedValue(buildEntity(0, true));
    await expect(
      useCase.execute({ id: 'booking_1', expectedVersion: 0, actorId: 'user_1' }),
    ).rejects.toBeInstanceOf(BookingAlreadyDeletedException);
  });

  it('cancels successfully when expectedVersion matches', async () => {
    const entity = buildEntity(0);
    mockRepo.findById.mockResolvedValue(entity);
    await useCase.execute({ id: 'booking_1', expectedVersion: 0, actorId: 'user_1' });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const saveArgs = mockRepo.save.mock.calls[0];
    expect(saveArgs[2]).toBe(0);
    expect(entity.isDeleted).toBe(true);
    expect(entity.status).toBe(BookingStatus.CANCELLED);
  });

  it('wraps execution in lock and transaction', async () => {
    mockRepo.findById.mockResolvedValue(buildEntity(0));
    await useCase.execute({ id: 'booking_1', expectedVersion: 0, actorId: 'user_1' });
    expect(mockLockService.runExclusive).toHaveBeenCalledTimes(1);
    expect(mockConnection.transaction).toHaveBeenCalledTimes(1);
  });
});
