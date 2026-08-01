import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { InternalUserQueryPort } from '../../ports/services/internal-user-query.port';
import { ConflictedUserDetails } from '../booking/get-booking.use-case';

export interface ConflictUserAggregate extends ConflictedUserDetails {
  userName: string;
  userEmail: string;
}

@Injectable()
export class GetConflicts7DaysUseCase implements IUseCase<void, ConflictUserAggregate[]> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    @Inject('InternalUserQueryPort')
    private readonly userQueryPort: InternalUserQueryPort,
  ) {}

  async execute(): Promise<ConflictUserAggregate[]> {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    // Get active bookings in the next 7 days
    const bookings = await this.bookingRepository.findActiveBookingsInDateRange(today, next7Days);
    
    // Find all users who are marked as conflicted in any of these bookings
    const conflictedUserIds = new Set<string>();
    bookings.forEach(b => {
      b.conflictedUsers.forEach(userId => conflictedUserIds.add(userId));
    });

    if (conflictedUserIds.size === 0) {
      return [];
    }

    const userIds = Array.from(conflictedUserIds);
    const users = await this.userQueryPort.findByIds(userIds);
    
    const result: ConflictUserAggregate[] = [];

    for (const user of users) {
      // Find all overlapping bookings for this user in this time period
      const userBookings = bookings.filter(b => b.participantIds.includes(user.id));
      
      // If they are in multiple bookings, they have a conflict
      if (userBookings.length > 1) {
        result.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          overlappingBookingIds: userBookings.map(b => b.id),
        });
      }
    }

    return result;
  }
}
