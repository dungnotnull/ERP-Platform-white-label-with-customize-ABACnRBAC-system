import {
  Controller,
  Get,
  Query,
  ForbiddenException,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { AuthOnly } from '@/domains/identity/presentation/decorators/auth-only.decorator';
import { GetActivityLogsUseCase } from '@/domains/activity-log/application/use-cases/get-activity-logs.use-case';
import { ActivityLogQueryDto } from '../dtos/activity-log-query.dto';

@ApiTags('Activity Logs')
@AuthOnly()
@Controller('activity-logs')
export class ActivityLogController {
  private readonly logger = new Logger(ActivityLogController.name);

  constructor(
    private readonly getActivityLogsUseCase: GetActivityLogsUseCase,
  ) {}

  @Get()
  @ResponseMessage('Activity logs retrieved successfully')
  @ApiOperation({ summary: 'Get paginated activity logs (superadmin only)' })
  async getLogs(@Req() req: any, @Query() query: ActivityLogQueryDto) {
    if (!req.user?.isSuperadmin) {
      throw new ForbiddenException('Only superadmins can view activity logs');
    }

    return this.getActivityLogsUseCase.execute({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      search: query.search,
      action: query.action,
      method: query.method,
      userEmail: query.userEmail,
      startDate: query.startDate,
      endDate: query.endDate,
      statusCode: query.statusCode,
      sort: query.sort ?? 'timestamp',
      order: (query.order as 'asc' | 'desc') ?? 'desc',
    });
  }
}
