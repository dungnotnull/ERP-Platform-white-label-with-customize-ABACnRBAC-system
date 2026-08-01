import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetDepartmentUsersUseCase } from '../../application/use-cases/integration/get-department-users.use-case';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { AuthOnly } from '@/domains/identity/presentation/decorators/auth-only.decorator';

@AuthOnly()
@Controller('departments')
export class DepartmentUsersController {
  constructor(
    private readonly getDepartmentUsersUseCase: GetDepartmentUsersUseCase,
  ) {}

  @Get(':id/users')
  @ResponseMessage('Retrieved department users successfully')
  async getDepartmentUsers(
    @Param('id') id: string,
    @Query('search') search?: string,
  ) {
    return this.getDepartmentUsersUseCase.execute({ departmentId: id, search });
  }
}
