import { BookingController } from './booking.controller';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

describe('BookingController', () => {
  let controller: BookingController;
  let useCases: Record<string, any>;

  beforeEach(() => {
    useCases = {
      create: { execute: jest.fn() },
      update: { execute: jest.fn() },
      delete: { execute: jest.fn() },
      get: { execute: jest.fn() },
      timeline: { execute: jest.fn().mockResolvedValue([]) },
      bookingDepartments: { execute: jest.fn().mockResolvedValue({ items: [] }) },
      bookingInternalUsers: { execute: jest.fn().mockResolvedValue({ items: [] }) },
    };
    controller = new BookingController(
      useCases.create as any,
      useCases.update as any,
      useCases.delete as any,
      useCases.get as any,
      useCases.timeline as any,
      useCases.bookingDepartments as any,
      useCases.bookingInternalUsers as any,
    );
  });

  describe('getTimeline', () => {
    it('forwards only startDate and endDate when no optional query params are provided', async () => {
      await controller.getTimeline({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      } as any);

      expect(useCases.timeline.execute).toHaveBeenCalledWith({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        roomIds: undefined,
        departmentIds: undefined,
        participantIds: undefined,
        conflictedUsers: undefined,
        creatorId: undefined,
        status: undefined,
        search: undefined,
      });
    });

    it('splits comma-separated id lists and forwards every filter', async () => {
      await controller.getTimeline({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        roomIds: 'room_a, room_b ,, room_c',
        departmentIds: 'dept_1,dept_2',
        participantIds: 'p1,p2,p3',
        conflictedUsers: 'c1,c2',
        creatorId: 'creator_1',
        status: 'COMPLETED',
        search: 'standup',
      } as any);

      expect(useCases.timeline.execute).toHaveBeenCalledWith({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        roomIds: ['room_a', 'room_b', 'room_c'],
        departmentIds: ['dept_1', 'dept_2'],
        participantIds: ['p1', 'p2', 'p3'],
        conflictedUsers: ['c1', 'c2'],
        creatorId: 'creator_1',
        status: BookingStatus.COMPLETED,
        search: 'standup',
      });
    });

    it('treats empty id strings as undefined', async () => {
      await controller.getTimeline({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        roomIds: '',
        departmentIds: ' , , ',
      } as any);

      const call = useCases.timeline.execute.mock.calls[0][0];
      expect(call.roomIds).toBeUndefined();
      expect(call.departmentIds).toBeUndefined();
    });

    it('returns the use case result unchanged', async () => {
      const expected = [{ id: 'booking_1' }];
      useCases.timeline.execute.mockResolvedValue(expected);

      const result = await controller.getTimeline({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      } as any);

      expect(result).toEqual(expected);
    });
  });

  describe('getDepartments', () => {
    it('delegates to the booking departments use case', async () => {
      const expected = { items: [{ id: 'dept_1' }], total: 1, page: 1, limit: 1000 };
      useCases.bookingDepartments.execute.mockResolvedValue(expected);

      const result = await controller.getDepartments('hr', '1000');

      expect(useCases.bookingDepartments.execute).toHaveBeenCalledWith({
        search: 'hr',
        limit: 1000,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getInternalUsers', () => {
    it('delegates to the booking internal users use case', async () => {
      const expected = { items: [{ id: 'user_1', name: 'Alice', department: null }], total: 1, page: 1, limit: 30, pageCount: 1 };
      useCases.bookingInternalUsers.execute.mockResolvedValue(expected);

      const result = await controller.getInternalUsers('alice', 'dept_1', '2', '30');

      expect(useCases.bookingInternalUsers.execute).toHaveBeenCalledWith({
        search: 'alice',
        departmentId: 'dept_1',
        page: 2,
        limit: 30,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getBooking', () => {
    it('delegates to the getBookingUseCase with the id', async () => {
      useCases.get.execute.mockResolvedValue({ id: 'b1' });
      const result = await controller.getBooking('b1');
      expect(useCases.get.execute).toHaveBeenCalledWith('b1');
      expect(result).toEqual({ id: 'b1' });
    });
  });

  describe('createBooking', () => {
    it('uses the authenticated userId as creatorId', async () => {
      const dto: any = { title: 'm' };
      useCases.create.execute.mockResolvedValue({ id: 'b1' });
      await controller.createBooking(dto, 'user_1');
      expect(useCases.create.execute).toHaveBeenCalledWith({ data: dto, creatorId: 'user_1' });
    });

    it('throws when no authenticated user is present', async () => {
      const dto: any = { title: 'm' };
      await expect(controller.createBooking(dto, '' as any)).rejects.toThrow(
        'Authenticated user is required',
      );
      expect(useCases.create.execute).not.toHaveBeenCalled();
    });
  });

  describe('updateBooking', () => {
    it('delegates to the update use case with id, dto and actorId', async () => {
      const dto: any = { title: 'updated' };
      useCases.update.execute.mockResolvedValue({ id: 'b1' });
      await controller.updateBooking('b1', dto, 'user_1');
      expect(useCases.update.execute).toHaveBeenCalledWith({ id: 'b1', data: dto, actorId: 'user_1' });
    });
  });

  describe('deleteBooking', () => {
    it('delegates to the delete use case with id, expectedVersion and actorId', async () => {
      useCases.delete.execute.mockResolvedValue({ id: 'b1' });
      await controller.deleteBooking('b1', { expectedVersion: 3 } as any, 'user_1');
      expect(useCases.delete.execute).toHaveBeenCalledWith({
        id: 'b1',
        expectedVersion: 3,
        actorId: 'user_1',
      });
    });
  });
});
