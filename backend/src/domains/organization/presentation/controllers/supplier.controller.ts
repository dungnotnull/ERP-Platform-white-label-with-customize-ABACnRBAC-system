import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  FindSuppliersQueryDto,
} from '../dtos/organization.dto';
import { CreateSupplierUseCase } from '@/domains/organization/application/use-cases/supplier/create-supplier.use-case';
import { UpdateSupplierUseCase } from '@/domains/organization/application/use-cases/supplier/update-supplier.use-case';
import { GetSuppliersUseCase } from '@/domains/organization/application/use-cases/supplier/get-suppliers.use-case';
import { GetSupplierUseCase } from '@/domains/organization/application/use-cases/supplier/get-supplier.use-case';
import { DeleteSupplierUseCase } from '../../application/use-cases/supplier/delete-supplier.use-case';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly updateSupplierUseCase: UpdateSupplierUseCase,
    private readonly getSuppliersUseCase: GetSuppliersUseCase,
    private readonly getSupplierUseCase: GetSupplierUseCase,
    private readonly deleteSupplierUseCase: DeleteSupplierUseCase,
  ) {}

  @Get()
  @ResponseMessage('Suppliers retrieved successfully')
  @ApiOperation({ summary: 'List suppliers (paginated)' })
  async findAll(@Query() query: FindSuppliersQueryDto) {
    const sortOrder =
      query.order === 'asc' || query.order === 'desc' ? query.order : undefined;

    return this.getSuppliersUseCase.execute({
      filter: { search: query.search, sort: query.sort ?? "updatedAt", order: sortOrder },
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
    });
  }

  @Get(':id')
  @ResponseMessage('Supplier retrieved successfully')
  @ApiOperation({ summary: 'Get supplier by ID' })
  async findOne(@Param('id') id: string) {
    return this.getSupplierUseCase.execute({ id });
  }

  @Post()
  @ResponseMessage('Supplier created successfully')
  @ApiOperation({ summary: 'Create a supplier' })
  async create(@Body() dto: CreateSupplierDto) {
    return this.createSupplierUseCase.execute(dto);
  }

  @Put(':id')
  @ResponseMessage('Supplier updated successfully')
  @ApiOperation({ summary: 'Update a supplier' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.updateSupplierUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @ResponseMessage('Supplier deleted successfully')
  @ApiOperation({ summary: 'Delete supplier' })
  async delete(@Param('id') id: string) {
    await this.deleteSupplierUseCase.execute(id);

    return {
      success: true,
    };
  }
}
