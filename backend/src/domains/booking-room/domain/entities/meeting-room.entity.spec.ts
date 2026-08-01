import { MeetingRoomEntity } from './meeting-room.entity';

describe('MeetingRoomEntity', () => {
  describe('create', () => {
    it('should create a valid meeting room', () => {
      const room = MeetingRoomEntity.create('', {
        name: 'Conference Room A',
        jpName: '\u4F1A\u8B70\u5BA4A',
        capacity: 20,
        description: 'Main conference room',
        isActive: true,
      });

      expect(room.name).toBe('Conference Room A');
      expect(room.jpName).toBe('\u4F1A\u8B70\u5BA4A');
      expect(room.capacity).toBe(20);
      expect(room.description).toBe('Main conference room');
      expect(room.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      const room = MeetingRoomEntity.create('room_1', {
        name: 'Room A',
        jpName: '',
        capacity: 10,
        description: '',
        isActive: true,
      });

      room.deactivate();

      expect(room.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('should update allowed fields including jpName', () => {
      const room = MeetingRoomEntity.create('room_1', {
        name: 'Room A',
        jpName: '\u90E8\u5C4BA',
        capacity: 10,
        description: '',
        isActive: true,
      });

      room.update({
        name: 'Updated Room A',
        jpName: '\u66F4\u65B0\u90E8\u5C4BA',
        capacity: 15,
      });

      expect(room.name).toBe('Updated Room A');
      expect(room.jpName).toBe('\u66F4\u65B0\u90E8\u5C4BA');
      expect(room.capacity).toBe(15);
    });
  });
});
