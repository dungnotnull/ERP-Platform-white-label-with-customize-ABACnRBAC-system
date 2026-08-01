import { Controller, Get, Query } from '@nestjs/common';
import { GetConflicts7DaysUseCase } from '../../application/use-cases/statistics/get-conflicts-7-days.use-case';
import { GetRoomUsageUseCase } from '../../application/use-cases/statistics/get-room-usage.use-case';
import { GetDepartmentStatsUseCase } from '../../application/use-cases/statistics/get-department-stats.use-case';
import { GetOverviewUseCase } from '../../application/use-cases/statistics/get-overview.use-case';
import { DateRangeDto } from '../../application/dtos/statistics.dto';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { AuthOnly } from '@/domains/identity/presentation/decorators/auth-only.decorator';

@AuthOnly()
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly getConflicts7DaysUseCase: GetConflicts7DaysUseCase,
    private readonly getRoomUsageUseCase: GetRoomUsageUseCase,
    private readonly getDepartmentStatsUseCase: GetDepartmentStatsUseCase,
    private readonly getOverviewUseCase: GetOverviewUseCase,
  ) {}

  @Get('conflicts/7-days')
  @ResponseMessage('Retrieved 7-day schedule conflicts statistics successfully')
  async getConflicts7Days() {
    return this.getConflicts7DaysUseCase.execute();
  }

  @Get('rooms/usage')
  @ResponseMessage('Retrieved meeting room usage statistics successfully')
  async getRoomUsage(@Query() query: DateRangeDto) {
    return this.getRoomUsageUseCase.execute(query);
  }

  @Get('departments')
  @ResponseMessage('Retrieved booking statistics by department successfully')
  async getDepartmentStats(@Query() query: DateRangeDto) {
    return this.getDepartmentStatsUseCase.execute(query);
  }

  @Get('overview')
  @ResponseMessage('Retrieved overview statistics successfully')
  async getOverview() {
    return this.getOverviewUseCase.execute();
  }
}
