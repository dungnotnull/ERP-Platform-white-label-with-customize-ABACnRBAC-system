import { BookingStatus } from '../enums/booking-status.enum';
import { BookingEntity } from './booking.entity';

describe('BookingEntity', () => {
  const validProps = {
    roomIds: ['room_1'],
    title: 'Test Meeting',
    departmentIds: [],
    participantIds: [],
    conflictedUsers: [],
    creatorId: 'user_123',
    startTime: new Date('2026-07-03T10:00:00+07:00'),
    endTime: new Date('2026-07-03T11:00:00+07:00'),
    note: '',
    jpTitle: '',
    jpNote: '',
    status: BookingStatus.SCHEDULED,
    isDeleted: false,
    deletedAt: null,
    history: [],
    version: 0,
  };

  describe('create', () => {
    it('should create a valid booking', () => {
      const booking = BookingEntity.create('', validProps);

      expect(booking.title).toBe('Test Meeting');
      expect(booking.status).toBe(BookingStatus.SCHEDULED);
    });
  });

  describe('cancel', () => {
    it('should set status to CANCELLED and mark as deleted', () => {
      const booking = BookingEntity.create('', validProps);
      const actorId = 'user_123';

      booking.cancel(actorId);

      expect(booking.status).toBe(BookingStatus.CANCELLED);
      expect(booking.isDeleted).toBe(true);
      expect(booking.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateRoomConflict', () => {
    it('should update conflicted users list', () => {
      const booking = BookingEntity.create('', validProps);
      const conflictedIds = ['user_1', 'user_2'];

      booking.updateRoomConflict(conflictedIds);

      expect(booking.conflictedUsers).toEqual(conflictedIds);
    });
  });

  describe('modifyDetails', () => {
    it('should update booking fields and add history entry', () => {
      const booking = BookingEntity.create('', validProps);
      const modifiedBy = 'user_456';

      booking.modifyDetails({
        title: 'Updated Meeting',
        roomIds: ['room_2'],
      }, modifiedBy);

      expect(booking.title).toBe('Updated Meeting');
      expect(booking.roomIds).toEqual(['room_2']);
      expect(booking.history.length).toBeGreaterThan(0);
      expect(booking.history[booking.history.length - 1].action).toBe('UPDATED');
    });
  });
});
