import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingRoomMongooseModule } from './infrastructure/persistence/mongoose.module';
import { OrganizationModule } from '../organization/organization.module';
import { IdentityMongooseModule } from '../identity/infrastructure/persistence/mongoose.module';

// Controllers
import { RoomController } from './presentation/controllers/room.controller';
import { BookingController } from './presentation/controllers/booking.controller';
import { StatisticsController } from './presentation/controllers/statistics.controller';
import { DepartmentUsersController } from './presentation/controllers/department-users.controller';
import { BookingHealthController } from './presentation/controllers/booking-health.controller';

// Room Use Cases
import { CreateRoomUseCase } from './application/use-cases/room/create-room.use-case';
import { UpdateRoomUseCase } from './application/use-cases/room/update-room.use-case';
import { DeactivateRoomUseCase } from './application/use-cases/room/deactivate-room.use-case';
import { GetRoomsUseCase } from './application/use-cases/room/get-rooms.use-case';
import { GetAllRoomsUseCase } from './application/use-cases/room/get-all-rooms.use-case';

// Booking Use Cases
import { CreateBookingUseCase } from './application/use-cases/booking/create-booking.use-case';
import { UpdateBookingUseCase } from './application/use-cases/booking/update-booking.use-case';
import { DeleteBookingUseCase } from './application/use-cases/booking/delete-booking.use-case';
import { GetBookingUseCase } from './application/use-cases/booking/get-booking.use-case';
import { GetTimelineUseCase } from './application/use-cases/booking/get-timeline.use-case';

// Statistics & Integration Use Cases
import { GetConflicts7DaysUseCase } from './application/use-cases/statistics/get-conflicts-7-days.use-case';
import { GetRoomUsageUseCase } from './application/use-cases/statistics/get-room-usage.use-case';
import { GetDepartmentStatsUseCase } from './application/use-cases/statistics/get-department-stats.use-case';
import { GetOverviewUseCase } from './application/use-cases/statistics/get-overview.use-case';
import { GetDepartmentUsersUseCase } from './application/use-cases/integration/get-department-users.use-case';
import { GetBookingDepartmentsUseCase } from './application/use-cases/integration/get-booking-departments.use-case';
import { GetBookingInternalUsersUseCase } from './application/use-cases/integration/get-booking-internal-users.use-case';

// Repositories & Services
import { RoomRepository } from './infrastructure/persistence/repositories/room.repository';
import { BookingRepository } from './infrastructure/persistence/repositories/booking.repository';
import { BookingCleanupScheduler } from './infrastructure/services/booking-cleanup.scheduler';
import { BookingMutationLockService } from './application/services/booking-mutation-lock.service';

const useCases = [
  CreateRoomUseCase,
  UpdateRoomUseCase,
  DeactivateRoomUseCase,
  GetRoomsUseCase,
  GetAllRoomsUseCase,
  CreateBookingUseCase,
  UpdateBookingUseCase,
  DeleteBookingUseCase,
  GetBookingUseCase,
  GetTimelineUseCase,
  GetConflicts7DaysUseCase,
  GetRoomUsageUseCase,
  GetDepartmentStatsUseCase,
  GetOverviewUseCase,
  GetDepartmentUsersUseCase,
  GetBookingDepartmentsUseCase,
  GetBookingInternalUsersUseCase,
];

@Module({
  imports: [
    BookingRoomMongooseModule,
    OrganizationModule,
    IdentityMongooseModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    RoomController,
    BookingController,
    StatisticsController,
    DepartmentUsersController,
    BookingHealthController,
  ],
  providers: [
    ...useCases,
    RoomRepository,
    BookingRepository,
    BookingCleanupScheduler,
    BookingMutationLockService,
    {
      provide: 'RoomRepositoryPort',
      useExisting: RoomRepository,
    },
    {
      provide: 'BookingRepositoryPort',
      useExisting: BookingRepository,
    },
  ],
  exports: [
    ...useCases,
    'RoomRepositoryPort',
    'BookingRepositoryPort',
  ],
})
export class BookingRoomModule {}
