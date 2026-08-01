import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { GetRolesUseCase } from '@/domains/identity/application/use-cases/role/get-roles.use-case';
import { GetRoleUseCase } from '@/domains/identity/application/use-cases/role/get-role.use-case';
import { UpdateRoleUseCase } from '@/domains/identity/application/use-cases/role/update-role.use-case';
import { CreateRoleUseCase } from '@/domains/identity/application/use-cases/role/create-role.use-case';
import { DeleteRoleUseCase } from '@/domains/identity/application/use-cases/role/delete-role.use-case';
import { GetRolesByDepartmentsUseCase } from '@/domains/identity/application/use-cases/role/get-roles-by-departments.use-case';
import { CreateRoleDto, UpdateRoleDto, DeleteRoleDto, GetRolesByDepartmentsDto } from '../dtos/role.dto';
import { RequireSystemSecret } from '../decorators/require-system-secret.decorator';
import { SystemSecretGuard } from '../guards/system-secret.guard';

@ApiTags('Roles')
@Controller('roles')
export class RoleController {
  constructor(
    private readonly getRolesUseCase: GetRolesUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly getRolesByDepartmentsUseCase: GetRolesByDepartmentsUseCase,
  ) { }

  @Get()
  @ResponseMessage('Roles retrieved successfully')
  @ApiOperation({ summary: 'List all roles' })
  async findAll() {
    return this.getRolesUseCase.execute({});
  }

  @Get('by-departments')
  @ResponseMessage('Roles by departments retrieved successfully')
  @ApiOperation({ summary: 'Get roles by department IDs' })
  async findByDepartments(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetRolesByDepartmentsDto,
  ) {
    return this.getRolesByDepartmentsUseCase.execute({
      departmentIds: dto.departmentIds,
    });
  }

  @Get(':id')
  @ResponseMessage('Role retrieved successfully')
  @ApiOperation({ summary: 'Get role by ID' })
  async findOne(@Param('id') id: string) {
    return this.getRoleUseCase.execute(id);
  }

  @Post()
  @ResponseMessage('Role created successfully')
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() dto: CreateRoleDto) {
    return this.createRoleUseCase.execute({
      name: dto.name,
      description: dto.description,
      departmentIds: dto.departmentIds ?? [],
      endpointPermissionIds: dto.permissionIds ?? [],
    });
  }

  @Put(':id')
  @ResponseMessage('Role updated successfully')
  @ApiOperation({ summary: 'Update a role' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.updateRoleUseCase.execute({
      id,
      name: dto.name,
      description: dto.description,
      endpointPermissionIds: dto.permissionIds,
      departmentIds: dto.departmentIds,
    });
  }

  @Delete(':id')
  @ResponseMessage('Role deleted successfully')
  @ApiOperation({ summary: 'Delete a role (soft or hard)' })
  @UseGuards(SystemSecretGuard)
  @RequireSystemSecret()
  async remove(@Param('id') id: string, @Body() dto: DeleteRoleDto) {
    return this.deleteRoleUseCase.execute({
      id,
      forceHard: dto.forceHard,
    });
  }
}
