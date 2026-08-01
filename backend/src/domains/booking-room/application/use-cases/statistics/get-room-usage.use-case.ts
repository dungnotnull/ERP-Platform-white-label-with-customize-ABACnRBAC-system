import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { DateRangeDto } from '../../dtos/statistics.dto';
import { RoomRepositoryPort } from '../../ports/repositories/room.repository.port';

export interface RoomUsageStats {
  roomId: string;
  roomName: string;
  totalBookings: number;
  totalHours: number;
}

@Injectable()
export class GetRoomUsageUseCase implements IUseCase<DateRangeDto, RoomUsageStats[]> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    @Inject('RoomRepositoryPort')
    private readonly roomRepository: RoomRepositoryPort,
  ) {}

  async execute(input: DateRangeDto): Promise<RoomUsageStats[]> {
    const today = new Date();
    const startDate = input.startDate ? new Date(input.startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = input.endDate ? new Date(input.endDate) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const usageRows = await this.bookingRepository.aggregateRoomUsage(startDate, endDate);
    
    // Enrich with room names if they are not fully populated by aggregation
    const result: RoomUsageStats[] = [];
    for (const row of usageRows) {
      if (row.roomName) {
        result.push({
          roomId: row.roomId,
          roomName: row.roomName,
          totalBookings: row.totalBookings,
          totalHours: row.totalHours,
        });
      } else {
        const room = await this.roomRepository.findById(row.roomId);
        result.push({
          roomId: row.roomId,
          roomName: room ? room.name : 'Unknown Room',
          totalBookings: row.totalBookings,
          totalHours: row.totalHours,
        });
      }
    }

    return result;
  }
}
