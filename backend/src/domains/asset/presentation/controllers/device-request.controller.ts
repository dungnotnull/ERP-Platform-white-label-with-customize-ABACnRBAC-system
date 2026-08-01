import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CurrentUser } from '@/domains/identity/presentation/decorators/current-user.decorator';
import { CreateDeviceRequestUseCase } from '@/domains/asset/application/use-cases/request/create-device-request.use-case';
import { UpdateDeviceRequestUseCase } from '@/domains/asset/application/use-cases/request/update-device-request.use-case';
import { ApproveDeviceRequestUseCase } from '@/domains/asset/application/use-cases/request/approve-device-request.use-case';
import { RejectDeviceRequestUseCase } from '@/domains/asset/application/use-cases/request/reject-device-request.use-case';
import { CompleteDeviceRequestUseCase } from '@/domains/asset/application/use-cases/request/complete-device-request.use-case';
import { CancelDeviceRequestUseCase } from '@/domains/asset/application/use-cases/request/cancel-device-request.use-case';
import { GetDeviceRequestsUseCase } from '@/domains/asset/application/use-cases/request/get-device-requests.use-case';
import { FindDeviceRequestsQueryDto } from '../dtos/device.dto';

@ApiTags('Device Requests')
@Controller('device-requests')
export class DeviceRequestController {
  constructor(
    private readonly createDeviceRequestUseCase: CreateDeviceRequestUseCase,
    private readonly updateDeviceRequestUseCase: UpdateDeviceRequestUseCase,
    private readonly approveDeviceRequestUseCase: ApproveDeviceRequestUseCase,
    private readonly rejectDeviceRequestUseCase: RejectDeviceRequestUseCase,
    private readonly completeDeviceRequestUseCase: CompleteDeviceRequestUseCase,
    private readonly cancelDeviceRequestUseCase: CancelDeviceRequestUseCase,
    private readonly getDeviceRequestsUseCase: GetDeviceRequestsUseCase,
  ) {}

  @Get()
  @ResponseMessage('Device requests retrieved successfully')
  @ApiOperation({ summary: 'List device requests (paginated)' })
  async findAll(@Query() query: FindDeviceRequestsQueryDto) {
    return this.getDeviceRequestsUseCase.execute({
      filter: {
        status: query.status,
        search: query.search,
        type: query.type,
        userId: query.userId,
        requestedByUserId: query.requestedByUserId,
      },
      page: query.page ? query.page : 1,
      limit: query.limit ? query.limit : 10,
    });
  }

  @Get(':id')
  @ResponseMessage('Device request retrieved successfully')
  @ApiOperation({ summary: 'Get device request by ID' })
  async findOne(@Param('id') id: string) {
    return this.getDeviceRequestsUseCase.execute({
      filter: { search: id },
    });
  }

  @Post()
  @ResponseMessage('Device request created successfully')
  @ApiOperation({ summary: 'Create a device request' })
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.createDeviceRequestUseCase.execute({
      ...dto,
      requestedBy: user?._id || user?.id || 'system',
    });
  }

  @Put(':id')
  @ResponseMessage('Device request updated successfully')
  @ApiOperation({ summary: 'Update a device request' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.updateDeviceRequestUseCase.execute({ id, ...dto });
  }

  @Patch(':id/approve')
  @ResponseMessage('Device request approved successfully')
  @ApiOperation({ summary: 'Approve a device request' })
  async approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.approveDeviceRequestUseCase.execute({
      id,
      approvedBy: user?._id || user?.id || 'system',
    });
  }

  @Patch(':id/reject')
  @ResponseMessage('Device request rejected successfully')
  @ApiOperation({ summary: 'Reject a device request' })
  async reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rejectDeviceRequestUseCase.execute({
      id,
      rejectedBy: user?._id || user?.id || 'system',
    });
  }

  @Patch(':id/complete')
  @ResponseMessage('Device request completed successfully')
  @ApiOperation({ summary: 'Complete a device request' })
  async complete(@Param('id') id: string) {
    return this.completeDeviceRequestUseCase.execute(id);
  }

  @Patch(':id/cancel')
  @ResponseMessage('Device request cancelled successfully')
  @ApiOperation({ summary: 'Cancel a device request' })
  async cancel(@Param('id') id: string) {
    return this.cancelDeviceRequestUseCase.execute(id);
  }

  @Delete(':id')
  @ResponseMessage('Device request deleted successfully')
  @ApiOperation({ summary: 'Delete a device request' })
  async remove(@Param('id') id: string) {
    return this.cancelDeviceRequestUseCase.execute(id);
  }
}
