import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreatePositionInput, PositionOutput } from '@/domains/organization/application/dtos/position.dtos';
import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import {
  normalizeAndValidateOrganizationNameJa,
  normalizeAndValidateOrganizationNameVi,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { toPositionOutput } from '@/domains/organization/application/mappers/organization-output.mapper';
import { DuplicatePositionNameException } from '@/domains/organization/domain/exceptions/duplicate-position-name.exception';

@Injectable()
export class CreatePositionUseCase implements IUseCase<CreatePositionInput, PositionOutput> {
  constructor(
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(input: CreatePositionInput): Promise<PositionOutput> {
    const nameVi = normalizeAndValidateOrganizationNameVi(input.nameVi, true);
    const nameJa = normalizeAndValidateOrganizationNameJa(input.nameJa);

    const existingActive = await this.positionRepository.findActiveByNameVi(nameVi);
    if (existingActive) {
      throw new DuplicatePositionNameException(nameVi);
    }

    const softDeleted = await this.positionRepository.findByNameVi(nameVi, {
      includeDeleted: true,
    });
    if (softDeleted?.isDeleted) {
      softDeleted.update({
        nameVi,
        nameJa,
        level: input.level ?? softDeleted.level,
        isDeleted: false,
      });
      const restored = await this.positionRepository.save(softDeleted);
      return toPositionOutput(restored);
    }

    const position = new PositionEntity('', {
      nameVi,
      nameJa,
      level: input.level ?? null,
      isDeleted: false,
    });

    const saved = await this.positionRepository.save(position);
    return toPositionOutput(saved);
  }
}
