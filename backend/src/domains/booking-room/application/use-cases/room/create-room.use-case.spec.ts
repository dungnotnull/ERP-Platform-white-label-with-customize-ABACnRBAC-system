import { CreateRoomUseCase } from './create-room.use-case';
import { MeetingRoomEntity } from '@/domains/booking-room/domain/entities/meeting-room.entity';

describe('CreateRoomUseCase', () => {
  let useCase: CreateRoomUseCase;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn().mockImplementation(async (room: MeetingRoomEntity) => room),
    };
    useCase = new CreateRoomUseCase(mockRepo);
  });

  it('persists jpName alongside the room name', async () => {
    const result = await useCase.execute({
      name: 'Conference Room A',
      jpName: '\u4F1A\u8B70\u5BA4A',
      capacity: 20,
      description: 'Main room',
    } as any);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const saved: MeetingRoomEntity = mockRepo.save.mock.calls[0][0];
    expect(saved.jpName).toBe('\u4F1A\u8B70\u5BA4A');
    expect(result).toMatchObject({ name: 'Conference Room A', jpName: '\u4F1A\u8B70\u5BA4A', capacity: 20, isActive: true });
  });

  it('defaults jpName to an empty string when omitted', async () => {
    const result = await useCase.execute({
      name: 'Room B',
      capacity: 8,
    } as any);
    expect(result).toMatchObject({ jpName: '' });
  });
});
