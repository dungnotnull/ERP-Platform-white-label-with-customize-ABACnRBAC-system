import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateMaintenanceUseCase } from '@/domains/asset/application/use-cases/maintenance/create-maintenance.use-case';
import { UpdateMaintenanceUseCase } from '@/domains/asset/application/use-cases/maintenance/update-maintenance.use-case';
import { GetMaintenanceUseCase } from '@/domains/asset/application/use-cases/maintenance/get-maintenance.use-case';

@ApiTags('Device Maintenance')
@Controller('device-maintenance')
export class DeviceMaintenanceController {
  constructor(
    private readonly createMaintenanceUseCase: CreateMaintenanceUseCase,
    private readonly updateMaintenanceUseCase: UpdateMaintenanceUseCase,
    private readonly getMaintenanceUseCase: GetMaintenanceUseCase,
  ) {}

  @Get()
  @ResponseMessage('Maintenance records retrieved successfully')
  @ApiOperation({ summary: 'List maintenance records' })
  async findAll(@Query() query: any) {
    return this.getMaintenanceUseCase.execute({
      deviceId: query.deviceId,
    });
  }

  @Get('pending')
  @ResponseMessage('Pending maintenance retrieved successfully')
  @ApiOperation({ summary: 'List pending maintenance' })
  async findPending() {
    return this.getMaintenanceUseCase.execute({ deviceId: '' });
  }

  @Get('device/:deviceId')
  @ResponseMessage('Device maintenance records retrieved successfully')
  @ApiOperation({ summary: 'Get maintenance by device' })
  async findByDevice(@Param('deviceId') deviceId: string) {
    return this.getMaintenanceUseCase.execute({ deviceId });
  }

  @Get(':id')
  @ResponseMessage('Maintenance record retrieved successfully')
  @ApiOperation({ summary: 'Get maintenance record' })
  async findOne(@Param('id') id: string) {
    return this.getMaintenanceUseCase.execute({ deviceId: id });
  }

  @Post()
  @ResponseMessage('Maintenance record created successfully')
  @ApiOperation({ summary: 'Create maintenance record' })
  async create(@Body() dto: any) {
    return this.createMaintenanceUseCase.execute(dto);
  }

  @Put(':id')
  @ResponseMessage('Maintenance record updated successfully')
  @ApiOperation({ summary: 'Update maintenance record' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.updateMaintenanceUseCase.execute({
      deviceId: id,
      maintenanceIndex: dto.maintenanceIndex,
      maintenanceType: dto.maintenanceType,
      status: dto.status,
      scheduledDate: dto.scheduledDate,
      cost: dto.cost,
      description: dto.description,
    });
  }

  @Delete(':id')
  @ResponseMessage('Maintenance record deleted successfully')
  @ApiOperation({ summary: 'Delete maintenance record' })
  async remove(@Param('id') id: string) {
    return this.updateMaintenanceUseCase.execute({
      deviceId: id,
      maintenanceIndex: -1,
      status: 'cancelled',
    });
  }
}
