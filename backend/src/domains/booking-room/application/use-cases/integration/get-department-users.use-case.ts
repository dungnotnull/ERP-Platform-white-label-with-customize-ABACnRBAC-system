import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserQueryPort, InternalUserDetails } from '../../ports/services/internal-user-query.port';

export interface GetDepartmentUsersInput {
  departmentId: string;
  search?: string;
}

@Injectable()
export class GetDepartmentUsersUseCase implements IUseCase<GetDepartmentUsersInput, InternalUserDetails[]> {
  constructor(
    @Inject('InternalUserQueryPort')
    private readonly userQueryPort: InternalUserQueryPort,
  ) {}

  async execute(input: GetDepartmentUsersInput): Promise<InternalUserDetails[]> {
    return this.userQueryPort.findByDepartmentId(input.departmentId, input.search);
  }
}
