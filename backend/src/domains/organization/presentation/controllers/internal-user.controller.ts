import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { getCsvValue, parseCsvBuffer } from '@/shared/infrastructure/utils/csv.util';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateInternalUserDto, UpdateInternalUserDto, FindInternalUsersDto } from '../dtos/organization.dto';
import { CreateInternalUserUseCase } from '@/domains/organization/application/use-cases/internal-user/create-internal-user.use-case';
import { UpdateInternalUserUseCase } from '@/domains/organization/application/use-cases/internal-user/update-internal-user.use-case';
import { DeleteInternalUserUseCase } from '@/domains/organization/application/use-cases/internal-user/delete-internal-user.use-case';
import { GetInternalUserUseCase } from '@/domains/organization/application/use-cases/internal-user/get-internal-user.use-case';
import { GetInternalUsersUseCase } from '@/domains/organization/application/use-cases/internal-user/get-internal-users.use-case';
import { GetDeviceSummaryUseCase } from '@/domains/organization/application/use-cases/internal-user/get-device-summary.use-case';
import { GetUserDeviceSummaryListUseCase } from '@/domains/organization/application/use-cases/internal-user/get-user-device-summary-list.use-case';
import { GetEmployeeDeviceSummaryReportUseCase } from '@/domains/organization/application/use-cases/internal-user/get-employee-device-summary-report.use-case';
import { ImportInternalUsersUseCase } from '@/domains/organization/application/use-cases/internal-user/import-internal-users.use-case';
import { buildLocalizedErrorPayload } from '@/domains/organization/application/i18n/import-internal-user-error.messages';
import {
  parseRequestLocale,
  type AppLocale,
} from '@/shared/infrastructure/i18n/parse-request-locale';
import { ExportInternalUsersUseCase } from '@/domains/organization/application/use-cases/internal-user/export-internal-users.use-case';

@ApiTags('Internal Users')
@Controller('internal-users')
export class InternalUserController {
  constructor(
    private readonly createInternalUserUseCase: CreateInternalUserUseCase,
    private readonly updateInternalUserUseCase: UpdateInternalUserUseCase,
    private readonly deleteInternalUserUseCase: DeleteInternalUserUseCase,
    private readonly getInternalUserUseCase: GetInternalUserUseCase,
    private readonly getInternalUsersUseCase: GetInternalUsersUseCase,
    private readonly getDeviceSummaryUseCase: GetDeviceSummaryUseCase,
    private readonly getUserDeviceSummaryListUseCase: GetUserDeviceSummaryListUseCase,
    private readonly getEmployeeDeviceSummaryReportUseCase: GetEmployeeDeviceSummaryReportUseCase,
    private readonly importInternalUsersUseCase: ImportInternalUsersUseCase,
    private readonly exportInternalUsersUseCase: ExportInternalUsersUseCase,
  ) {}

  @Get()
  @ResponseMessage('Internal users retrieved successfully')
  @ApiOperation({ summary: 'List internal users (paginated)' })
  async findAll(@Query() query: FindInternalUsersDto & { q?: string; department?: string; position?: string; status?: string }) {
    const status = query.status ?? query.isActive;
    let isActive: boolean | undefined;
    if (status === 'all') {
      isActive = undefined;
    } else if (status === 'active' || status === 'true') {
      isActive = true;
    } else if (status === 'inactive' || status === 'false') {
      isActive = false;
    } else {
      // Mặc định: nhân viên đang làm việc (isActive), chưa xóa mềm (isDeleted — lọc ở repository)
      isActive = true;
    }

    const order =
      query.order === 'asc' || query.order === 'desc' ? query.order : undefined;

    return this.getInternalUsersUseCase.execute({
      filter: {
        search: query.search ?? query.q,
        departmentId: query.departmentId ?? query.department,
        positionId: query.positionId ?? query.position,
        isActive,
        sort: query.sort,
        order,
      },
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export internal users as CSV file' })
  async export(@Res() res: Response): Promise<void> {
    const csv = await this.exportInternalUsersUseCase.execute({});
    const fileName = `employees_export_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csv);
  }

  @Get('device-summary')
  @ResponseMessage('Employee device summary report retrieved successfully')
  @ApiOperation({ summary: 'Device summary report grouped by employee' })
  async getEmployeeDeviceSummary(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getEmployeeDeviceSummaryReportUseCase.execute({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('user-device-summary')
  @ResponseMessage('User device summary list retrieved successfully')
  @ApiOperation({ summary: 'List assigned devices for a user' })
  async getUserDeviceSummaryList(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    if (!userId) {
      const locale = parseRequestLocale(acceptLanguage);
      throw new BadRequestException(
        buildLocalizedErrorPayload('USER_ID_REQUIRED', {}, locale),
      );
    }

    return this.getUserDeviceSummaryListUseCase.execute({
      userId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Internal users imported successfully')
  @ApiOperation({ summary: 'Import internal users from CSV file' })
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Body() body: {
      data?: Array<{
        name: string;
        email: string;
        employeeCode: string;
        departmentCode?: string;
        departmentName?: string;
        positionName?: string;
        role?: string;
        isActive?: boolean;
      }>;
    },
  ) {
    const locale = parseRequestLocale(acceptLanguage);

    const data = file?.buffer
      ? await this.parseInternalUserCsv(file.buffer, locale)
      : body.data;

    if (!data?.length) {
      this.throwLocalizedImportError('IMPORT_DATA_REQUIRED', {}, locale);
    }

    return this.importInternalUsersUseCase.execute({
      data,
      locale,
    });
  }

  private throwLocalizedImportError(
    errorCode: string,
    params: Record<string, string>,
    locale: AppLocale,
  ): never {
    throw new BadRequestException(
      buildLocalizedErrorPayload(errorCode, params, locale),
    );
  }

  private async parseInternalUserCsv(
    buffer: Buffer,
    locale: AppLocale,
  ): Promise<
    Array<{
      name: string;
      email: string;
      employeeCode: string;
      departmentCode?: string;
      departmentName?: string;
      positionLevel?: number;
      positionName?: string;
      isActive?: boolean;
      role?: string;
    }>
  > {
    const content = buffer
      .toString('utf8')
      .replace(/^\uFEFF/, '');
    const rows = await parseCsvBuffer(Buffer.from(content, 'utf8'));

    const REQUIRED_HEADERS = [
      'name',
      'email',
      'employeeCode',
      'department',
      'position',
      'isActive',
    ];

    if (!rows.length) {
      this.throwLocalizedImportError('IMPORT_CSV_EMPTY', {}, locale);
    }

    const actualHeaders = Object.keys(rows[0]).map(h => h.trim());

    const missingHeaders = REQUIRED_HEADERS.filter(
      header => !actualHeaders.includes(header),
    );

    if (missingHeaders.length > 0) {
      this.throwLocalizedImportError('IMPORT_CSV_MISSING_COLUMNS', {
        columns: missingHeaders.join(', '),
      }, locale);
    }

    return rows
      .map((row) => {
        const name = getCsvValue(row, ['name']);
        const emailRaw = getCsvValue(row, ['email']);
        const employeeCode = getCsvValue(row, ['employeecode', 'employee_code', 'employee code']);

        const departmentCode = getCsvValue(row, [
          'department',
          'departmentcode',
          'department_code',
        ]);
        const departmentName = getCsvValue(row, ['departmentname', 'department_name']);

        const positionRaw = getCsvValue(row, ['position', 'positionname', 'position_name']);
        const levelRaw = getCsvValue(row, ['level', 'position_level', 'positionlevel']);
        const positionLevel = this.parsePositionLevel(positionRaw, levelRaw);
        const positionName = positionLevel === undefined ? positionRaw : getCsvValue(row, ['positionname', 'position_name']);

        const isActiveRaw = getCsvValue(row, ['isactive', 'is_active', 'active']);
        const isActive = this.parseBoolean(isActiveRaw);

        return {
          name: name ?? '',
          email: emailRaw?.trim().toLowerCase() ?? '',
          employeeCode: employeeCode ?? '',
          ...(departmentCode ? { departmentCode } : {}),
          ...(departmentName ? { departmentName } : {}),
          ...(positionLevel !== undefined ? { positionLevel } : {}),
          ...(positionName ? { positionName } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
          role: getCsvValue(row, ['role']),
        };
      });
  }

  private parsePositionLevel(positionRaw?: string, levelRaw?: string): number | undefined {
    const raw = levelRaw ?? positionRaw;
    if (!raw) {
      return undefined;
    }

    const asNumber = Number.parseInt(raw, 10);
    if (!Number.isNaN(asNumber) && String(asNumber) === raw.trim()) {
      return asNumber;
    }

    return undefined;
  }

  private parseBoolean(value?: string): boolean | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }

    return undefined;
  }

  @Post()
  @ResponseMessage('Internal user created successfully')
  @ApiOperation({ summary: 'Create an internal user' })
  async create(@Body() dto: CreateInternalUserDto) {
    const isActive =
      dto.isActive !== undefined ? dto.isActive === 'true' : undefined;

    return this.createInternalUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      employeeCode: dto.employeeCode,
      departmentId: dto.departmentId,
      positionId: dto.positionId,
      role: dto.role,
      ...(isActive !== undefined ? { isActive } : {}),
    });
  }

  @Get(':id/device-summary')
  @ResponseMessage('Device summary retrieved successfully')
  @ApiOperation({ summary: 'Get device summary counts for an internal user' })
  async getDeviceSummary(@Param('id') id: string) {
    return this.getDeviceSummaryUseCase.execute({ userId: id });
  }

  @Patch(':id/department-position')
  @ResponseMessage('Department and position updated successfully')
  @ApiOperation({ summary: 'Update internal user department and/or position' })
  async updateDepartmentPosition(
    @Param('id') id: string,
    @Body() body: { department?: string; position?: string },
  ) {
    return this.updateInternalUserUseCase.execute({
      id,
      ...(body.department !== undefined ? { departmentId: body.department } : {}),
      ...(body.position !== undefined ? { positionId: body.position } : {}),
    });
  }

  @Put(':id')
  @ResponseMessage('Internal user updated successfully')
  @ApiOperation({ summary: 'Update an internal user' })
  async update(@Param('id') id: string, @Body() dto: UpdateInternalUserDto) {
    const input: Record<string, unknown> = { id };
    if (dto.name !== undefined) input.name = dto.name;
    if (dto.employeeCode !== undefined) input.employeeCode = dto.employeeCode;
    if (dto.departmentId !== undefined) input.departmentId = dto.departmentId;
    if (dto.positionId !== undefined) input.positionId = dto.positionId;
    if (dto.role !== undefined) input.role = dto.role;
    if (dto.isActive !== undefined) {
      input.isActive = dto.isActive === 'true';
    }
    return this.updateInternalUserUseCase.execute(input as never);
  }

  @Delete(':id')
  @ResponseMessage('Internal user deleted successfully')
  @ApiOperation({ summary: 'Soft-delete an internal user (isDeleted, hidden from lists)' })
  async remove(@Param('id') id: string) {
    return this.deleteInternalUserUseCase.execute({ id });
  }

  @Get(':id')
  @ResponseMessage('Internal user retrieved successfully')
  @ApiOperation({ summary: 'Get internal user by ID' })
  async findOne(@Param('id') id: string) {
    return this.getInternalUserUseCase.execute({ id });
  }
}
