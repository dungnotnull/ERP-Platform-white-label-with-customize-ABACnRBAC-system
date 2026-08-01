import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentNotFoundException } from '@/domains/organization/domain/exceptions/department-not-found.exception';
import { DepartmentHasUsersException } from '@/domains/organization/domain/exceptions/department-has-users.exception';

export interface DeleteDepartmentInput {
  id: string;
  forceHard?: boolean;
}

export interface DeleteDepartmentOutput {
  deleted: boolean;
}

@Injectable()
export class DeleteDepartmentUseCase implements IUseCase<DeleteDepartmentInput, DeleteDepartmentOutput> {
  constructor(
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
  ) {}

  async execute(input: DeleteDepartmentInput): Promise<DeleteDepartmentOutput> {
    const department = await this.departmentRepository.findById(input.id);
    if (!department) {
      throw new DepartmentNotFoundException(input.id);
    }

    const userCount = await this.internalUserRepository.countByDepartmentId(input.id);
    if (userCount > 0) {
      throw new DepartmentHasUsersException(userCount);
    }

    if (input.forceHard === true) {
      await this.departmentRepository.removeFromAllUsers(input.id);
      await this.departmentRepository.removeFromAllRoles(input.id);
      await this.departmentRepository.delete(input.id);
    } else {
      department.softDelete();
      await this.departmentRepository.save(department);
    }

    return { deleted: true };
  }
}
