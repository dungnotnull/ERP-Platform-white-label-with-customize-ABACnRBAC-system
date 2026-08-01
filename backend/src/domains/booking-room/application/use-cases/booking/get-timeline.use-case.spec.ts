import { GetTimelineUseCase } from './get-timeline.use-case';
import { BookingEntity } from '@/domains/booking-room/domain/entities/booking.entity';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

describe('GetTimelineUseCase', () => {
  let useCase: GetTimelineUseCase;
  let mockRepo: any;

  const baseProps = {
    roomIds: ['room_1'],
    title: 'Test Meeting',
    departmentIds: [],
    participantIds: [],
    conflictedUsers: [],
    creatorId: 'user_123',
    startTime: new Date('2026-07-03T10:00:00.000Z'),
    endTime: new Date('2026-07-03T11:00:00.000Z'),
    note: '',
    jpTitle: '',
    jpNote: '',
    status: BookingStatus.SCHEDULED,
    isDeleted: false,
    deletedAt: null,
    history: [],
    version: 0,
  };

  beforeEach(() => {
    mockRepo = {
      findActiveBookingsInDateRange: jest.fn(),
    };
    useCase = new GetTimelineUseCase(mockRepo);
  });

  it('parses the date range and forwards an empty filter when no optional fields are provided', async () => {
    mockRepo.findActiveBookingsInDateRange.mockResolvedValue([]);

    await useCase.execute({
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
    });

    expect(mockRepo.findActiveBookingsInDateRange).toHaveBeenCalledTimes(1);
    const [start, end, filter] = mockRepo.findActiveBookingsInDateRange.mock.calls[0];
    expect(start).toEqual(new Date('2026-07-01T00:00:00.000Z'));
    expect(end).toEqual(new Date('2026-07-31T23:59:59.000Z'));
    expect(filter).toEqual({});
  });

  it('forwards all provided filters to the repository', async () => {
    mockRepo.findActiveBookingsInDateRange.mockResolvedValue([]);

    await useCase.execute({
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
      roomIds: ['room_a', 'room_b'],
      departmentIds: ['dept_1'],
      participantIds: ['p_1', 'p_2'],
      conflictedUsers: ['c_1'],
      creatorId: 'creator_1',
      status: BookingStatus.COMPLETED,
      search: 'standup',
    });

    expect(mockRepo.findActiveBookingsInDateRange).toHaveBeenCalledWith(
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T23:59:59.000Z'),
      {
        roomIds: ['room_a', 'room_b'],
        departmentIds: ['dept_1'],
        participantIds: ['p_1', 'p_2'],
        conflictedUsers: ['c_1'],
        creatorId: 'creator_1',
        status: BookingStatus.COMPLETED,
        search: 'standup',
      },
    );
  });

  it('omits empty array filters from the forwarded filter object', async () => {
    mockRepo.findActiveBookingsInDateRange.mockResolvedValue([]);

    await useCase.execute({
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
      roomIds: [],
      departmentIds: [],
      participantIds: [],
      conflictedUsers: [],
    });

    const [, , filter] = mockRepo.findActiveBookingsInDateRange.mock.calls[0];
    expect(filter).toEqual({});
  });

  it('maps returned entities to plain objects', async () => {
    const entity = BookingEntity.create('booking_1', baseProps);
    mockRepo.findActiveBookingsInDateRange.mockResolvedValue([entity]);

    const result = await useCase.execute({
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'booking_1',
      title: 'Test Meeting',
      status: BookingStatus.SCHEDULED,
    });
  });

  it('returns an empty array when the repository finds no bookings', async () => {
    mockRepo.findActiveBookingsInDateRange.mockResolvedValue([]);
    const result = await useCase.execute({
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
    });
    expect(result).toEqual([]);
  });
});
