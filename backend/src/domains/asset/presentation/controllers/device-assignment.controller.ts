import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CurrentUser } from '@/domains/identity/presentation/decorators/current-user.decorator';
import { AssignDeviceUseCase } from '@/domains/asset/application/use-cases/assignment/assign-device.use-case';
import { ReturnDeviceUseCase } from '@/domains/asset/application/use-cases/assignment/return-device.use-case';
import { GetAssignmentsUseCase } from '@/domains/asset/application/use-cases/assignment/get-assignments.use-case';

@ApiTags('Device Assignments')
@Controller('device-assignments')
export class DeviceAssignmentController {
  constructor(
    private readonly assignDeviceUseCase: AssignDeviceUseCase,
    private readonly returnDeviceUseCase: ReturnDeviceUseCase,
    private readonly getAssignmentsUseCase: GetAssignmentsUseCase,
  ) {}

  @Post()
  @ResponseMessage('Device assigned successfully')
  @ApiOperation({ summary: 'Assign device to user' })
  async assign(@Body() dto: any, @CurrentUser() user: any) {
    // console.log("Assign Device Body:", dto);
    return this.assignDeviceUseCase.execute({
      deviceId: dto.deviceId,
      userId: dto.userId,
      userName: dto.userName,
      assignedBy: user?._id || user?.id || 'system',
      deviceRequestId: dto.deviceRequestId,
    });
  }

  @Put(':id/return')
  @ResponseMessage('Device returned successfully')
  @ApiOperation({ summary: 'Return a device' })
  async returnDevice(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    // console.log("Return Device Body:", dto);
    return this.returnDeviceUseCase.execute({
      deviceId: id,
      returnedBy: user?._id || user?.id || 'system',
      notes: dto.returnNotes,
    });
  }

  @Get('active')
  @ResponseMessage('Active assignments retrieved successfully')
  @ApiOperation({ summary: 'List active assignments' })
  async findActive() {
    return this.getAssignmentsUseCase.execute({});
  }

  @Get('user/:userId')
  @ResponseMessage('User assignments retrieved successfully')
  @ApiOperation({ summary: 'Get assignments by user' })
  async findByUser(@Param('userId') userId: string) {
    return this.getAssignmentsUseCase.execute({ assignedUserId: userId });
  }
}
