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
import { CreatePositionDto, UpdatePositionDto } from '../dtos/organization.dto';
import { CreatePositionUseCase } from '@/domains/organization/application/use-cases/position/create-position.use-case';
import { UpdatePositionUseCase } from '@/domains/organization/application/use-cases/position/update-position.use-case';
import { DeletePositionUseCase } from '@/domains/organization/application/use-cases/position/delete-position.use-case';
import { GetPositionsUseCase } from '@/domains/organization/application/use-cases/position/get-positions.use-case';
import { ImportPositionsUseCase } from '@/domains/organization/application/use-cases/position/import-positions.use-case';
import { ExportPositionsUseCase } from '@/domains/organization/application/use-cases/position/export-positions.use-case';

@ApiTags('Positions')
@Controller('positions')
export class PositionController {
  constructor(
    private readonly createPositionUseCase: CreatePositionUseCase,
    private readonly updatePositionUseCase: UpdatePositionUseCase,
    private readonly deletePositionUseCase: DeletePositionUseCase,
    private readonly getPositionsUseCase: GetPositionsUseCase,
    private readonly importPositionsUseCase: ImportPositionsUseCase,
    private readonly exportPositionsUseCase: ExportPositionsUseCase,
  ) {}

  @Get()
  @ResponseMessage('Positions retrieved successfully')
  @ApiOperation({ summary: 'List all positions' })
  async findAll(@Query('search') search?: string) {
    return this.getPositionsUseCase.execute({ search });
  }

  @Get('export')
  @ResponseMessage('Positions exported successfully')
  @ApiOperation({ summary: 'Export positions' })
  async export() {
    return this.exportPositionsUseCase.execute({});
  }

  @Get(':id')
  @ResponseMessage('Position retrieved successfully')
  @ApiOperation({ summary: 'Get position by ID' })
  async findOne(@Param('id') id: string) {
    return this.getPositionsUseCase.execute({ search: id });
  }

  @Post()
  @ResponseMessage('Position created successfully')
  @ApiOperation({ summary: 'Create a position' })
  async create(@Body() dto: CreatePositionDto) {
    return this.createPositionUseCase.execute(dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Positions imported successfully')
  @ApiOperation({ summary: 'Import positions from CSV data' })
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { data?: Array<{ nameVi?: string; nameJa?: string; name?: string; level?: number }> },
  ) {
    const data = file?.buffer
      ? await this.parsePositionCsv(file.buffer)
      : body.data;

    if (!data?.length) {
      throw new BadRequestException('Import data is required');
    }

    return this.importPositionsUseCase.execute({ data });
  }

  private async parsePositionCsv(
    buffer: Buffer,
  ): Promise<Array<{ nameVi: string; nameJa?: string; level?: number }>> {
    const rows = await parseCsvBuffer(buffer);

    return rows
      .map((row) => {
        const nameVi = getCsvValue(row, ['nameVi', 'name_vi', 'namevi']);
        const nameJa = getCsvValue(row, ['nameJa', 'name_ja', 'nameja']);
        const legacyName = getCsvValue(row, ['name', 'position', 'position_name', 'positionname']);
        const resolvedNameVi = nameVi || legacyName;
        if (!resolvedNameVi) {
          return null;
        }

        const levelValue = getCsvValue(row, ['level', 'position_level']);
        const level = levelValue ? Number.parseInt(levelValue, 10) : undefined;

        return {
          nameVi: resolvedNameVi,
          ...(nameJa ? { nameJa } : {}),
          ...(level !== undefined && !Number.isNaN(level) ? { level } : {}),
        };
      })
      .filter(
        (row): row is { nameVi: string; nameJa?: string; level?: number } => row !== null,
      );
  }

  @Put(':id')
  @ResponseMessage('Position updated successfully')
  @ApiOperation({ summary: 'Update a position' })
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.updatePositionUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @ResponseMessage('Position deleted successfully')
  @ApiOperation({ summary: 'Delete a position' })
  async remove(@Param('id') id: string) {
    return this.deletePositionUseCase.execute({ id });
  }
}
