import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CurrentUser } from '@/domains/identity/presentation/decorators/current-user.decorator';
import { CreateAbacPolicyUseCase } from '@/domains/identity/application/use-cases/abac-policy/create-abac-policy.use-case';
import { GetAbacPoliciesUseCase } from '@/domains/identity/application/use-cases/abac-policy/get-abac-policies.use-case';
import { UpdateAbacPolicyUseCase } from '@/domains/identity/application/use-cases/abac-policy/update-abac-policy.use-case';
import { DeleteAbacPolicyUseCase } from '@/domains/identity/application/use-cases/abac-policy/delete-abac-policy.use-case';
import { CreateAbacPolicyDto, UpdateAbacPolicyDto } from '@/domains/identity/presentation/dtos/abac-policy.dto';

@ApiTags('ABAC Policies')
@Controller('abac-policies')
export class AbacPolicyController {
  constructor(
    private readonly getPoliciesUseCase: GetAbacPoliciesUseCase,
    private readonly createPolicyUseCase: CreateAbacPolicyUseCase,
    private readonly updatePolicyUseCase: UpdateAbacPolicyUseCase,
    private readonly deletePolicyUseCase: DeleteAbacPolicyUseCase,
  ) {}

  @Get()
  @ResponseMessage('ABAC policies retrieved successfully')
  @ApiOperation({ summary: 'List all ABAC policies' })
  async findAll() {
    return this.getPoliciesUseCase.execute();
  }

  @Post()
  @ResponseMessage('ABAC policy created successfully')
  @ApiOperation({ summary: 'Create a new ABAC policy' })
  async create(@Body() body: CreateAbacPolicyDto, @CurrentUser() currentUser: any) {
    return this.createPolicyUseCase.execute({
      name: body.name,
      description: body.description,
      roleIds: body.roleIds ?? [],
      resource: body.resource,
      action: body.action,
      effect: body.effect ?? 'allow',
      conditions: body.conditions ?? [],
      createdBy: currentUser?._id || currentUser?.userId || 'system',
    });
  }

  @Put(':id')
  @ResponseMessage('ABAC policy updated successfully')
  @ApiOperation({ summary: 'Update an ABAC policy' })
  async update(@Param('id') id: string, @Body() body: UpdateAbacPolicyDto) {
    return this.updatePolicyUseCase.execute({
      id,
      description: body.description,
      roleIds: body.roleIds,
      effect: body.effect,
      conditions: body.conditions,
      isActive: body.isActive,
    });
  }

  @Delete(':id')
  @ResponseMessage('ABAC policy deleted successfully')
  @ApiOperation({ summary: 'Delete an ABAC policy' })
  async remove(@Param('id') id: string) {
    return this.deletePolicyUseCase.execute(id);
  }
}
