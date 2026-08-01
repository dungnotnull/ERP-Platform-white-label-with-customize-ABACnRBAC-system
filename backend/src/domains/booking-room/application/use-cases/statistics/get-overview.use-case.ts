import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { RoomRepositoryPort } from '../../ports/repositories/room.repository.port';

export interface OverviewStats {
  totalActiveRooms: number;
  totalBookingsThisMonth: number;
  totalBookingsToday: number;
}

@Injectable()
export class GetOverviewUseCase implements IUseCase<void, OverviewStats> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    @Inject('RoomRepositoryPort')
    private readonly roomRepository: RoomRepositoryPort,
  ) {}

  async execute(): Promise<OverviewStats> {
    const activeRooms = await this.roomRepository.findAll({ isActive: true });
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const thisMonthBookings = await this.bookingRepository.findActiveBookingsInDateRange(startOfMonth, endOfMonth);
    const todayBookings = await this.bookingRepository.findActiveBookingsInDateRange(startOfDay, endOfDay);

    return {
      totalActiveRooms: activeRooms.length,
      totalBookingsThisMonth: thisMonthBookings.length,
      totalBookingsToday: todayBookings.length,
    };
  }
}
