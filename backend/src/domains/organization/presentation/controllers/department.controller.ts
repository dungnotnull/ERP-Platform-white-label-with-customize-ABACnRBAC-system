import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { getCsvValue, parseCsvBuffer } from '@/shared/infrastructure/utils/csv.util';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dtos/organization.dto';
import { CreateDepartmentUseCase } from '@/domains/organization/application/use-cases/department/create-department.use-case';
import { UpdateDepartmentUseCase } from '@/domains/organization/application/use-cases/department/update-department.use-case';
import { DeleteDepartmentUseCase } from '@/domains/organization/application/use-cases/department/delete-department.use-case';
import { GetDepartmentsUseCase } from '@/domains/organization/application/use-cases/department/get-departments.use-case';
import { GetDepartmentsOverviewUseCase } from '@/domains/organization/application/use-cases/department/get-departments-overview.use-case';
import { GetDevicesByDepartmentUseCase } from '@/domains/organization/application/use-cases/department/get-devices-by-department.use-case';
import { ImportDepartmentsUseCase } from '@/domains/organization/application/use-cases/department/import-departments.use-case';
import { ExportDepartmentsUseCase } from '@/domains/organization/application/use-cases/department/export-departments.use-case';
import { Public } from '@/domains/identity/presentation/decorators/public.decorator';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentController {
  constructor(
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
    private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly getDepartmentsOverviewUseCase: GetDepartmentsOverviewUseCase,
    private readonly getDevicesByDepartmentUseCase: GetDevicesByDepartmentUseCase,
    private readonly importDepartmentsUseCase: ImportDepartmentsUseCase,
    private readonly exportDepartmentsUseCase: ExportDepartmentsUseCase,
  ) { }

  @Public()
  @Get()
  @ResponseMessage('Departments retrieved successfully')
  @ApiOperation({ summary: 'List all departments' })
  async findAll(@Query('search') search?: string) {
    return this.getDepartmentsUseCase.execute({ search });
  }

  @Get('export')
  @ResponseMessage('Departments exported successfully')
  @ApiOperation({ summary: 'Export departments' })
  async export() {
    return this.exportDepartmentsUseCase.execute({});
  }

  @Get('overview')
  @ResponseMessage('Departments overview retrieved successfully')
  @ApiOperation({ summary: 'List departments with employee counts and members' })
  async overview() {
    return this.getDepartmentsOverviewUseCase.execute();
  }

  @Get('get-devices-by-department')
  @ResponseMessage('Devices by department retrieved successfully')
  @ApiOperation({
    summary: 'Get assigned device counts grouped by department and device type',
  })
  async getDevicesByDepartment() {
    return this.getDevicesByDepartmentUseCase.execute();
  }

  @Get(':id')
  @ResponseMessage('Department retrieved successfully')
  @ApiOperation({ summary: 'Get department by ID' })
  async findOne(@Param('id') id: string) {
    return this.getDepartmentsUseCase.execute({ search: id });
  }

  @Post()
  @ResponseMessage('Department created successfully')
  @ApiOperation({ summary: 'Create a department' })
  async create(@Body() dto: CreateDepartmentDto) {
    return this.createDepartmentUseCase.execute(dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Departments imported successfully')
  @ApiOperation({ summary: 'Import departments from CSV data' })
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { data?: Array<{ code: string; nameVi?: string; nameJa?: string; name?: string; description?: string }> },
  ) {
    const data = file?.buffer
      ? await this.parseDepartmentCsv(file.buffer)
      : body.data;

    if (!data?.length) {
      throw new BadRequestException('Import data is required');
    }

    return this.importDepartmentsUseCase.execute({ data });
  }

  private async parseDepartmentCsv(
    buffer: Buffer,
  ): Promise<Array<{ code: string; nameVi: string; nameJa?: string; description?: string }>> {
    const rows = await parseCsvBuffer(buffer);

    return rows
      .map((row) => {
        const code = getCsvValue(row, ['code', 'department_code', 'departmentcode']);
        const nameVi = getCsvValue(row, ['nameVi', 'name_vi', 'namevi']);
        const nameJa = getCsvValue(row, ['nameJa', 'name_ja', 'nameja']);
        const legacyName = getCsvValue(row, ['name', 'department', 'department_name', 'departmentname']);
        const resolvedNameVi = nameVi || legacyName;

        if (!code || !resolvedNameVi) {
          return null;
        }

        const description = getCsvValue(row, ['description', 'department_description']);

        return {
          code,
          nameVi: resolvedNameVi,
          ...(nameJa ? { nameJa } : {}),
          ...(description ? { description } : {}),
        };
      })
      .filter(
        (row): row is { code: string; nameVi: string; nameJa?: string; description?: string } =>
          row !== null,
      );
  }

  @Put(':id')
  @ResponseMessage('Department updated successfully')
  @ApiOperation({ summary: 'Update a department' })
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.updateDepartmentUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @ResponseMessage('Department deleted successfully')
  @ApiOperation({ summary: 'Delete a department' })
  async remove(@Param('id') id: string) {
    return this.deleteDepartmentUseCase.execute({ id });
  }
}
