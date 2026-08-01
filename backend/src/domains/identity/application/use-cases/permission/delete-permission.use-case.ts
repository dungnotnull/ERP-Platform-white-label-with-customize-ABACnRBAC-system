import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PermissionNotFoundException } from '@/domains/identity/domain/exceptions/permission-not-found.exception';
import { PermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/permission.repository.port';

export interface DeletePermissionInput {
  id: string;
  deletedBy: string;
}

@Injectable()
export class DeletePermissionUseCase implements IUseCase<DeletePermissionInput, void> {
  constructor(
    @Inject('PermissionRepositoryPort') private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(input: DeletePermissionInput): Promise<void> {
    const permission = await this.permissionRepository.findById(input.id);
    if (!permission) {
      throw new PermissionNotFoundException(input.id);
    }

    permission.softDelete(input.deletedBy);
    await this.permissionRepository.save(permission);
  }
}
