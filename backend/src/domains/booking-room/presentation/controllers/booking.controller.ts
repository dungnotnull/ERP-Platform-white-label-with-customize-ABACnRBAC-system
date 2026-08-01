import { Controller, Get, Post, Put, Delete, Body, Param, Query, UnauthorizedException } from '@nestjs/common';
import { CreateBookingUseCase } from '../../application/use-cases/booking/create-booking.use-case';
import { UpdateBookingUseCase } from '../../application/use-cases/booking/update-booking.use-case';
import { DeleteBookingUseCase } from '../../application/use-cases/booking/delete-booking.use-case';
import { GetBookingUseCase } from '../../application/use-cases/booking/get-booking.use-case';
import { GetTimelineUseCase } from '../../application/use-cases/booking/get-timeline.use-case';
import { GetBookingDepartmentsUseCase } from '../../application/use-cases/integration/get-booking-departments.use-case';
import { GetBookingInternalUsersUseCase } from '../../application/use-cases/integration/get-booking-internal-users.use-case';
import { CreateBookingDto, UpdateBookingDto, DeleteBookingDto, FindTimelineDto } from '../../application/dtos/booking.dto';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CurrentUser } from '@/domains/identity/presentation/decorators/current-user.decorator';
import { AuthOnly } from '@/domains/identity/presentation/decorators/auth-only.decorator';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

@AuthOnly()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly updateBookingUseCase: UpdateBookingUseCase,
    private readonly deleteBookingUseCase: DeleteBookingUseCase,
    private readonly getBookingUseCase: GetBookingUseCase,
    private readonly getTimelineUseCase: GetTimelineUseCase,
    private readonly getBookingDepartmentsUseCase: GetBookingDepartmentsUseCase,
    private readonly getBookingInternalUsersUseCase: GetBookingInternalUsersUseCase,
  ) {}

  @Get('timeline')
  @ResponseMessage('Retrieved booking timeline successfully')
  async getTimeline(@Query() query: FindTimelineDto) {
    const toIdArray = (value?: string): string[] | undefined => {
      if (!value) return undefined;
      const ids = value.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
      return ids.length > 0 ? ids : undefined;
    };

    const status = query.status ? (query.status as BookingStatus) : undefined;

    return this.getTimelineUseCase.execute({
      startDate: query.startDate,
      endDate: query.endDate,
      roomIds: toIdArray(query.roomIds),
      departmentIds: toIdArray(query.departmentIds),
      participantIds: toIdArray(query.participantIds),
      conflictedUsers: toIdArray(query.conflictedUsers),
      creatorId: query.creatorId,
      status,
      search: query.search,
    });
  }

  @Get('departments')
  @ResponseMessage('Retrieved booking departments successfully')
  async getDepartments(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getBookingDepartmentsUseCase.execute({
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('internal-users')
  @ResponseMessage('Retrieved booking participants successfully')
  async getInternalUsers(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getBookingInternalUsersUseCase.execute({
      search,
      departmentId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ResponseMessage('Retrieved booking details successfully')
  async getBooking(@Param('id') id: string) {
    return this.getBookingUseCase.execute(id);
  }

  @Post()
  @ResponseMessage('Created booking successfully')
  async createBooking(
    @Body() dto: CreateBookingDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }
    return this.createBookingUseCase.execute({ data: dto, creatorId: userId });
  }

  @Put(':id')
  @ResponseMessage('Updated booking successfully')
  async updateBooking(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }
    return this.updateBookingUseCase.execute({ id, data: dto, actorId: userId });
  }

  @Delete(':id')
  @ResponseMessage('Cancelled booking successfully')
  async deleteBooking(
    @Param('id') id: string,
    @Body() dto: DeleteBookingDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }
    return this.deleteBookingUseCase.execute({
      id,
      expectedVersion: dto.expectedVersion,
      actorId: userId,
    });
  }
}
