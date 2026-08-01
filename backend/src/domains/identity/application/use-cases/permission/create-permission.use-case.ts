import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreatePermissionInput, PermissionOutput } from '@/domains/identity/application/dtos/permission.dtos';
import { PermissionEntity } from '@/domains/identity/domain/entities/permission.entity';
import { PermissionRepositoryPort } from '@/domains/identity/application/ports/repositories/permission.repository.port';
import { BaseStatusEnum } from '@/shared/domain/enums/status.enum';
@Injectable()
export class CreatePermissionUseCase implements IUseCase<CreatePermissionInput, PermissionOutput> {
  constructor(
    @Inject('PermissionRepositoryPort') private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(input: CreatePermissionInput): Promise<PermissionOutput> {
    const permission = new PermissionEntity('', {
      name: input.name,
      description: input.description,
      status: BaseStatusEnum.ACTIVE,
      createdBy: input.createdBy,
    });

    const saved = await this.permissionRepository.save(permission);

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      status: saved.status,
    };
  }
}
