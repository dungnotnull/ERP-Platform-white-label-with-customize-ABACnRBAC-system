import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { RoleOutput } from '@/domains/identity/application/dtos/role.dtos';
import { RoleRepositoryPort } from '@/domains/identity/application/ports/repositories/role.repository.port';

export interface GetRolesByDepartmentsInput {
  departmentIds: string[];
}

export type GetRolesByDepartmentsOutput = RoleOutput[];

@Injectable()
export class GetRolesByDepartmentsUseCase implements IUseCase<GetRolesByDepartmentsInput, GetRolesByDepartmentsOutput> {
  constructor(
    @Inject('RoleRepositoryPort') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(input: GetRolesByDepartmentsInput): Promise<GetRolesByDepartmentsOutput> {
    const roles = await this.roleRepository.findByDepartmentIds(input.departmentIds);

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      endpointPermissionIds: role.endpointPermissionIds,
      departmentIds: role.departmentIds,
      isSystem: role.isSystem,
      status: role.status,
    }));
  }
}
