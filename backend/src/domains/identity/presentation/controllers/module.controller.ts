import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/domains/identity/presentation/decorators/public.decorator';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { GetModulesUseCase } from '@/domains/identity/application/use-cases/module/get-modules.use-case';

@ApiTags('Modules')
@Controller('modules')
export class ModuleController {
  constructor(
    private readonly getModulesUseCase: GetModulesUseCase,
  ) {}

  @Public()
  @Get()
  @ResponseMessage('Modules retrieved successfully')
  @ApiOperation({ summary: 'List all active modules' })
  async findAll() {
    return this.getModulesUseCase.execute();
  }
}
