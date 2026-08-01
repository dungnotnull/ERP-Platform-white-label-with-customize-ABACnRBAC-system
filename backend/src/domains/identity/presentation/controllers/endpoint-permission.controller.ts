import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateEndpointPermissionUseCase } from '@/domains/identity/application/use-cases/endpoint-permission/create-endpoint-permission.use-case';
import { UpdateEndpointPermissionUseCase } from '@/domains/identity/application/use-cases/endpoint-permission/update-endpoint-permission.use-case';
import { DeleteEndpointPermissionUseCase } from '@/domains/identity/application/use-cases/endpoint-permission/delete-endpoint-permission.use-case';
import { GetEndpointPermissionsUseCase } from '@/domains/identity/application/use-cases/endpoint-permission/get-endpoint-permissions.use-case';
import { CreateEndpointPermissionDto, UpdateEndpointPermissionDto, DeleteEndpointPermissionDto } from '../dtos/endpoint-permission.dto';
import { RouteDiscoveryService } from '@/domains/identity/application/services/route-discovery.service';
import { RequireSystemSecret } from '../decorators/require-system-secret.decorator';
import { SystemSecretGuard } from '../guards/system-secret.guard';
import { Public } from '../decorators/public.decorator';

@ApiTags('Endpoint Permissions')
@Controller('endpoint-permissions')
export class EndpointPermissionController {
  constructor(
    private readonly getEndpointPermissionsUseCase: GetEndpointPermissionsUseCase,
    private readonly createEndpointPermissionUseCase: CreateEndpointPermissionUseCase,
    private readonly updateEndpointPermissionUseCase: UpdateEndpointPermissionUseCase,
    private readonly deleteEndpointPermissionUseCase: DeleteEndpointPermissionUseCase,
    private readonly routeDiscoveryService: RouteDiscoveryService,
  ) { }

  @Get('routes')
  @ResponseMessage('Discovered routes retrieved successfully')
  @ApiOperation({ summary: 'List all BE controller routes with assignment status' })
  async getRoutes(@Query('module') module?: string) {
    return this.routeDiscoveryService.getRoutes(module);
  }

  @Public()
  @Get()
  @ResponseMessage('Endpoint permissions retrieved successfully')
  @ApiOperation({ summary: 'List endpoint permissions (paginated)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('module') module?: string,
    @Query('method') method?: string,
  ) {
    return this.getEndpointPermissionsUseCase.execute({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      filter: {
        ...(module ? { module } : {}),
        ...(method ? { method } : {}),
      },
    });
  }

  @Post()
  @ResponseMessage('Endpoint permission created successfully')
  @ApiOperation({ summary: 'Create a new endpoint permission' })
  async create(@Body() dto: CreateEndpointPermissionDto) {
    return this.createEndpointPermissionUseCase.execute({
      method: dto.method,
      pathPattern: dto.pathPattern,
      module: dto.module,
      permission: dto.permission,
      description: dto.description,
    });
  }

  @Put(':id')
  @ResponseMessage('Endpoint permission updated successfully')
  @ApiOperation({ summary: 'Update an endpoint permission' })
  async update(@Param('id') id: string, @Body() dto: UpdateEndpointPermissionDto) {

    const result = await this.updateEndpointPermissionUseCase.execute({
      id,
      method: dto.method,
      pathPattern: dto.pathPattern,
      module: dto.module,
      permission: dto.permission,
      description: dto.description,
    });

    return result;
  }

  @Delete(':id')
  @ResponseMessage('Endpoint permission deleted successfully')
  @ApiOperation({ summary: 'Delete an endpoint permission (soft or hard)' })
  @UseGuards(SystemSecretGuard)
  @RequireSystemSecret()
  async remove(@Param('id') id: string, @Body() dto: DeleteEndpointPermissionDto) {
    return this.deleteEndpointPermissionUseCase.execute({
      id,
      forceHard: dto.forceHard,
    });
  }
}
