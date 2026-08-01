import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PositionOutput } from '@/domains/organization/application/dtos/position.dtos';
import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import {
  normalizeAndValidateOrganizationNameJa,
  normalizeAndValidateOrganizationNameVi,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { toPositionOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

export interface ImportPositionRow {
  nameVi?: string;
  nameJa?: string;
  name?: string;
  level?: number;
}

export interface ImportPositionsInput {
  data: ImportPositionRow[];
}

@Injectable()
export class ImportPositionsUseCase implements IUseCase<ImportPositionsInput, PositionOutput[]> {
  constructor(
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(input: ImportPositionsInput): Promise<PositionOutput[]> {
    const results: PositionOutput[] = [];

    for (const row of input.data) {
      const nameVi = normalizeAndValidateOrganizationNameVi(
        row.nameVi ?? row.name,
        true,
      );
      const nameJa = normalizeAndValidateOrganizationNameJa(row.nameJa);

      const active = await this.positionRepository.findActiveByNameVi(nameVi);
      if (active) {
        active.update({
          nameVi,
          nameJa,
          level: row.level ?? active.level,
        });
        const saved = await this.positionRepository.save(active);
        results.push(toPositionOutput(saved));
        continue;
      }

      const softDeleted = await this.positionRepository.findByNameVi(nameVi, {
        includeDeleted: true,
      });
      if (softDeleted?.isDeleted) {
        softDeleted.update({
          nameVi,
          nameJa,
          level: row.level ?? softDeleted.level,
          isDeleted: false,
        });
        const restored = await this.positionRepository.save(softDeleted);
        results.push(toPositionOutput(restored));
        continue;
      }

      const position = new PositionEntity('', {
        nameVi,
        nameJa,
        level: row.level ?? null,
        isDeleted: false,
      });
      const saved = await this.positionRepository.save(position);
      results.push(toPositionOutput(saved));
    }

    return results;
  }
}
