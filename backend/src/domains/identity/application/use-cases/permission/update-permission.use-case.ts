import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdatePermissionInput, PermissionOutput } from '@/domains/identity/application/dtos/permission.dtos';
import { PermissionNotFoundException } from '@/domains/identity/domain/exceptions/permission-not-found.exception';
import { PermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/permission.repository.port';

@Injectable()
export class UpdatePermissionUseCase implements IUseCase<UpdatePermissionInput, PermissionOutput> {
  constructor(
    @Inject('PermissionRepositoryPort') private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(input: UpdatePermissionInput): Promise<PermissionOutput> {
    const permission = await this.permissionRepository.findById(input.id);
    if (!permission) {
      throw new PermissionNotFoundException(input.id);
    }

    permission.update({
      name: input.name,
      description: input.description,
      updatedBy: input.updatedBy,
    });

    await this.permissionRepository.save(permission);

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      status: permission.status,
    };
  }
}
