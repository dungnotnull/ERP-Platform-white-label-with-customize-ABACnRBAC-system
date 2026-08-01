import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreatePermissionUseCase } from '@/domains/identity/application/use-cases/permission/create-permission.use-case';
import { UpdatePermissionUseCase } from '@/domains/identity/application/use-cases/permission/update-permission.use-case';
import { DeletePermissionUseCase } from '@/domains/identity/application/use-cases/permission/delete-permission.use-case';
import { GetPermissionsUseCase } from '@/domains/identity/application/use-cases/permission/get-permissions.use-case';
import { CreatePermissionDto, UpdatePermissionDto } from '../dtos/permission.dto';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    private readonly deletePermissionUseCase: DeletePermissionUseCase,
    private readonly getPermissionsUseCase: GetPermissionsUseCase,
  ) {}

  @Get()
  @ResponseMessage('Permissions retrieved successfully')
  @ApiOperation({ summary: 'List all permissions' })
  async findAll(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.getPermissionsUseCase.execute({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post()
  @ResponseMessage('Permission created successfully')
  @ApiOperation({ summary: 'Create a new permission' })
  async create(@Body() dto: CreatePermissionDto, @CurrentUser() user: any) {
    return this.createPermissionUseCase.execute({
      ...dto,
      createdBy: user?._id || user?.id || 'system',
    });
  }

  @Put(':id')
  @ResponseMessage('Permission updated successfully')
  @ApiOperation({ summary: 'Update a permission' })
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto, @CurrentUser() user: any) {
    return this.updatePermissionUseCase.execute({
      id,
      ...dto,
      updatedBy: user?._id || user?.id || 'system',
    });
  }

  @Delete(':id')
  @ResponseMessage('Permission deleted successfully')
  @ApiOperation({ summary: 'Soft delete a permission' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.deletePermissionUseCase.execute({
      id,
      deletedBy: user?._id || user?.id || 'system',
    });
  }
}
