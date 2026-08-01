import { BookingEntity } from './booking.entity';
import { BookingStatus } from '../enums/booking-status.enum';

const baseProps = {
  roomIds: ['room_1'],
  title: 'Test',
  departmentIds: [],
  participantIds: [],
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
  version: 0,
};

describe('BookingEntity version field', () => {
  it('initializes version to 0 on create', () => {
    const entity = BookingEntity.create('booking_1', baseProps);
    expect(entity.version).toBe(0);
  });

  it('increments version on modifyDetails', () => {
    const entity = BookingEntity.create('booking_1', { ...baseProps, version: 3 });
    entity.modifyDetails({ title: 'Updated' }, 'user_1');
    expect(entity.version).toBe(4);
  });

  it('increments version on cancel', () => {
    const entity = BookingEntity.create('booking_1', { ...baseProps, version: 3 });
    entity.cancel('user_1');
    expect(entity.version).toBe(4);
  });

  it('does not increment version on updateRoomConflict', () => {
    const entity = BookingEntity.create('booking_1', { ...baseProps, version: 3 });
    entity.updateRoomConflict(['user_2']);
    expect(entity.version).toBe(3);
  });

  it('includes version in toPlainObject', () => {
    const entity = BookingEntity.create('booking_1', { ...baseProps, version: 5 });
    expect(entity.toPlainObject().version).toBe(5);
  });
});
