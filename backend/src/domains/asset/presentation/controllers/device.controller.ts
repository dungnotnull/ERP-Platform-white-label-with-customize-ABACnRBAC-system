import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CurrentUser } from '@/domains/identity/presentation/decorators/current-user.decorator';
import { CreateDeviceUseCase } from '@/domains/asset/application/use-cases/device/create-device.use-case';
import { UpdateDeviceUseCase } from '@/domains/asset/application/use-cases/device/update-device.use-case';
import { UpdateDeviceStatusUseCase } from '@/domains/asset/application/use-cases/device/update-device-status.use-case';
import { DeleteDeviceUseCase } from '@/domains/asset/application/use-cases/device/delete-device.use-case';
import { GetDeviceUseCase } from '@/domains/asset/application/use-cases/device/get-device.use-case';
import { GetDevicesUseCase } from '@/domains/asset/application/use-cases/device/get-devices.use-case';
import { GetDeviceStatisticsUseCase } from '@/domains/asset/application/use-cases/device/get-device-statistics.use-case';
import {
  ImportDevicesUseCase,
  type ImportDeviceRow,
} from '@/domains/asset/application/use-cases/device/import-devices.use-case';
import { buildLocalizedErrorPayload } from '@/shared/infrastructure/i18n/api-error.messages';
import { parseRequestLocale } from '@/shared/infrastructure/i18n/parse-request-locale';
import { ExportDevicesUseCase } from '@/domains/asset/application/use-cases/device/export-devices.use-case';
import { ResourceAction } from '@/domains/identity/presentation/decorators/resource-action.decorator';
import { FindDevicesDto } from '../dtos/device.dto';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
  constructor(
    private readonly createDeviceUseCase: CreateDeviceUseCase,
    private readonly updateDeviceUseCase: UpdateDeviceUseCase,
    private readonly updateDeviceStatusUseCase: UpdateDeviceStatusUseCase,
    private readonly deleteDeviceUseCase: DeleteDeviceUseCase,
    private readonly getDeviceUseCase: GetDeviceUseCase,
    private readonly getDevicesUseCase: GetDevicesUseCase,
    private readonly getDeviceStatisticsUseCase: GetDeviceStatisticsUseCase,
    private readonly importDevicesUseCase: ImportDevicesUseCase,
    private readonly exportDevicesUseCase: ExportDevicesUseCase,
  ) {}

  @Get()
  @ResourceAction('device', 'read')
  @ResponseMessage('Devices retrieved successfully')
  @ApiOperation({ summary: 'List devices (paginated, filtered)' })
  async findAll(@Query() query: FindDevicesDto) {
    return this.getDevicesUseCase.execute({
      filter: {
        search: query.search,
        deviceTypeId:
          query.deviceTypeId === 'all'
            ? undefined
            : query.deviceTypeId,

        deviceStatusId:
          query.deviceStatusId === 'all'
            ? undefined
            : query.deviceStatusId,

        isDeleted: query.isDeleted,
      },

      page: query.page ?? 1,
      limit: query.limit ?? 10,

      sort: query.sort,
      order: query.order,
    });
  }

  @Get('statistics')
  @ResponseMessage('Device statistics retrieved successfully')
  @ApiOperation({ summary: 'Get device statistics' })
  async getStatistics() {
    return this.getDeviceStatisticsUseCase.execute();
  }

  @Get('export')
  @ResponseMessage('Devices exported successfully')
  @ApiOperation({ summary: 'Export devices to CSV' })
  async export() {
    return this.exportDevicesUseCase.execute({});
  }

  @Get(':id')
  @ResponseMessage('Device retrieved successfully')
  @ApiOperation({ summary: 'Get device by ID' })
  async findOne(@Param('id') id: string) {
    return this.getDeviceUseCase.execute(id);
  }

  @Post()
  @ResponseMessage('Device created successfully')
  @ApiOperation({ summary: 'Create a new device' })
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.createDeviceUseCase.execute({
      ...dto,
      createdBy: user?._id || user?.id || 'system',
    });
  }

  @Post('import')
  @ResponseMessage('Devices imported successfully')
  @ApiOperation({ summary: 'Import devices from CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async import(
    @Body() body: { rows?: ImportDeviceRow[] },
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: any,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    if (!file && !body?.rows?.length) {
      const locale = parseRequestLocale(acceptLanguage);
      throw new BadRequestException(
        buildLocalizedErrorPayload('IMPORT_CSV_OR_ROWS_REQUIRED', {}, locale),
      );
    }

    const locale = parseRequestLocale(acceptLanguage);

    return this.importDevicesUseCase.execute({
      fileBuffer: file?.buffer,
      rows: body?.rows,
      createdBy: user?._id || user?.id || 'system',
      locale,
    });
  }

  @Put(':id')
  @ResponseMessage('Device updated successfully')
  @ApiOperation({ summary: 'Update a device' })
  async update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.updateDeviceUseCase.execute({
      id,
      ...dto,
      updatedBy: user?._id || user?.id || 'system',
    });
  }

  @Put(':id/status')
  @ResponseMessage('Device status updated successfully')
  @ApiOperation({ summary: 'Update device status' })
  async updateStatus(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.updateDeviceStatusUseCase.execute({
      id,
      newStatusId: dto.newStatusId,
      performedBy: user?._id || user?.id || 'system',
    });
  }

  @Delete(':id')
  @ResponseMessage('Device deleted successfully')
  @ApiOperation({ summary: 'Soft delete a device' })
  async remove(@Param('id') id: string) {
    return this.deleteDeviceUseCase.execute(id);
  }
}
