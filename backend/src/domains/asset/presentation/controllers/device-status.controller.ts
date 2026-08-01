import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateDeviceStatusUseCase } from '@/domains/asset/application/use-cases/device-status/create-device-status.use-case';
import { UpdateDeviceStatusUseCase } from '@/domains/asset/application/use-cases/device-status/update-device-status.use-case';
import { GetDeviceStatusesUseCase } from '@/domains/asset/application/use-cases/device-status/get-device-statuses.use-case';

@ApiTags('Device Statuses')
@Controller('device-statuses')
export class DeviceStatusController {
  constructor(
    private readonly createDeviceStatusUseCase: CreateDeviceStatusUseCase,
    private readonly updateDeviceStatusUseCase: UpdateDeviceStatusUseCase,
    private readonly getDeviceStatusesUseCase: GetDeviceStatusesUseCase,
  ) {}

  @Get()
  @ResponseMessage('Device statuses retrieved successfully')
  @ApiOperation({ summary: 'List all device statuses' })
  async findAll() {
    return this.getDeviceStatusesUseCase.execute();
  }

  @Get(':id')
  @ResponseMessage('Device status retrieved successfully')
  @ApiOperation({ summary: 'Get device status by ID' })
  async findOne(@Param('id') id: string) {
    return this.getDeviceStatusesUseCase.execute();
  }

  @Post()
  @ResponseMessage('Device status created successfully')
  @ApiOperation({ summary: 'Create a device status' })
  async create(@Body() dto: any) {
    return this.createDeviceStatusUseCase.execute(dto);
  }

  @Delete(':id')
  @ResponseMessage('Device status deleted successfully')
  @ApiOperation({ summary: 'Delete a device status' })
  async remove(@Param('id') id: string) {
    return this.updateDeviceStatusUseCase.execute({
      id,
      isActive: false,
    });
  }
}
