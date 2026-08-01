import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthOnly } from '../decorators/auth-only.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreateUserDto, UpdateUserDto, UpdateUserProfileDto, FindUsersDto, SetSuperadminDto } from '../dtos/user.dto';
import { CreateUserUseCase } from '@/domains/identity/application/use-cases/user/create-user.use-case';
import { UpdateUserUseCase } from '@/domains/identity/application/use-cases/user/update-user.use-case';
import { UpdateUserProfileUseCase } from '@/domains/identity/application/use-cases/user/update-user-profile.use-case';
import { GetUserUseCase } from '@/domains/identity/application/use-cases/user/get-user.use-case';
import { GetUsersUseCase } from '@/domains/identity/application/use-cases/user/get-users.use-case';
import { SetSuperadminUseCase } from '@/domains/identity/application/use-cases/user/set-superadmin.use-case';
import { UserFilterInput } from '@/domains/identity/application/dtos/user.dtos';
import { SuperadminSecretGuard } from '../guards/superadmin-secret.guard';
import { RequireSuperadminSecret } from '../decorators/require-superadmin-secret.decorator';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly setSuperadminUseCase: SetSuperadminUseCase,
  ) { }

  @Get('profile')
  @AuthOnly()
  @ResponseMessage('Profile retrieved successfully')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.getUserUseCase.execute(user._id || user.id);
  }

  @Put('profile')
  @ResponseMessage('Profile updated successfully')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateUserProfileDto) {
    return this.updateUserProfileUseCase.execute({
      id: user._id || user.id,
      name: dto.name,
      nickName: dto.nickName,
      bio: dto.bio,
    });
  }

  @Get()
  @ResponseMessage('Users retrieved successfully')
  @ApiOperation({ summary: 'List all users (paginated)' })
  async findAll(@Query() query: FindUsersDto) {
    const filter: UserFilterInput = {};
    if (query.search) filter.search = query.search;
    if (query.status) filter.status = query.status;
    if (query.roleId) filter.roleId = query.roleId;
    if (query.departmentId) filter.departmentId = query.departmentId;

    return this.getUsersUseCase.execute({
      filter,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
    });
  }

  @Get(':id')
  @ResponseMessage('User retrieved successfully')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.getUserUseCase.execute(id);
  }

  @Post()
  @ResponseMessage('User created successfully')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.createUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      roleIds: dto.roleIds,
      nickName: dto.nickName,
      createdBy: user?._id || user?.id || 'system',
    });
  }

  @Put(':id')
  @ResponseMessage('User updated successfully')
  @ApiOperation({ summary: 'Update a user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.updateUserUseCase.execute({
      id,
      name: dto.name,
      nickName: dto.nickName,
      status: dto.status,
      roleIds: dto.roleIds,
      departmentIds: dto.departmentIds,
      visibleMenus: dto.visibleMenus,
      updatedBy: user?._id || user?.id || 'system',
    });
  }

  @Put(':id/superadmin')
  @UseGuards(SuperadminSecretGuard)
  @RequireSuperadminSecret()
  @ResponseMessage('Superadmin status updated successfully')
  @ApiOperation({ summary: 'Set or remove superadmin status for a user' })
  async setSuperadmin(@Param('id') id: string, @Body() dto: SetSuperadminDto) {
    return this.setSuperadminUseCase.execute({
      userId: id,
      isSuperadmin: dto.isSuperadmin,
    });
  }
}
