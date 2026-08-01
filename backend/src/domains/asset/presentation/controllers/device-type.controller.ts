import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateDeviceTypeUseCase } from '@/domains/asset/application/use-cases/device-type/create-device-type.use-case';
import { UpdateDeviceTypeUseCase } from '@/domains/asset/application/use-cases/device-type/update-device-type.use-case';
import { GetDeviceTypesUseCase } from '@/domains/asset/application/use-cases/device-type/get-device-types.use-case';

@ApiTags('Device Types')
@Controller('device-types')
export class DeviceTypeController {
  constructor(
    private readonly createDeviceTypeUseCase: CreateDeviceTypeUseCase,
    private readonly updateDeviceTypeUseCase: UpdateDeviceTypeUseCase,
    private readonly getDeviceTypesUseCase: GetDeviceTypesUseCase,
  ) {}

  @Get()
  @ResponseMessage('Device types retrieved successfully')
  @ApiOperation({ summary: 'List all device types' })
  async findAll() {
    return this.getDeviceTypesUseCase.execute();
  }

  @Get(':id')
  @ResponseMessage('Device type retrieved successfully')
  @ApiOperation({ summary: 'Get device type by ID' })
  async findOne(@Param('id') id: string) {
    return this.getDeviceTypesUseCase.execute();
  }

  @Post()
  @ResponseMessage('Device type created successfully')
  @ApiOperation({ summary: 'Create a device type' })
  async create(@Body() dto: any) {
    return this.createDeviceTypeUseCase.execute(dto);
  }

  @Put(':id')
  @ResponseMessage('Device type updated successfully')
  @ApiOperation({ summary: 'Update a device type' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.updateDeviceTypeUseCase.execute({ id, ...dto });
  }
}
