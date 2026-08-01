import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdatePositionInput, PositionOutput } from '@/domains/organization/application/dtos/position.dtos';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { PositionNotFoundException } from '@/domains/organization/domain/exceptions/position-not-found.exception';
import {
  normalizeAndValidateOrganizationNameJa,
  normalizeAndValidateOrganizationNameVi,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { toPositionOutput } from '@/domains/organization/application/mappers/organization-output.mapper';
import { DuplicatePositionNameException } from '@/domains/organization/domain/exceptions/duplicate-position-name.exception';

@Injectable()
export class UpdatePositionUseCase implements IUseCase<UpdatePositionInput, PositionOutput> {
  constructor(
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(input: UpdatePositionInput): Promise<PositionOutput> {
    const position = await this.positionRepository.findById(input.id);
    if (!position) {
      throw new PositionNotFoundException(input.id);
    }

    const validatedNameVi =
      input.nameVi !== undefined
        ? normalizeAndValidateOrganizationNameVi(input.nameVi, true)
        : undefined;
    const validatedNameJa =
      input.nameJa !== undefined
        ? normalizeAndValidateOrganizationNameJa(input.nameJa)
        : undefined;

    if (validatedNameVi !== undefined && validatedNameVi !== position.nameVi) {
      const owner = await this.positionRepository.findActiveByNameVi(validatedNameVi);
      if (owner && owner.id !== input.id) {
        throw new DuplicatePositionNameException(validatedNameVi);
      }
    }

    position.update({
      nameVi: validatedNameVi,
      nameJa: validatedNameJa,
      level: input.level,
    });

    const saved = await this.positionRepository.save(position);
    return toPositionOutput(saved);
  }
}
