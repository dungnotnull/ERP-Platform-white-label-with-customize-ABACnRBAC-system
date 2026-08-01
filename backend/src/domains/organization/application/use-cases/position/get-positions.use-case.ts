import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PositionOutput } from '@/domains/organization/application/dtos/position.dtos';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { toPositionOutput } from '@/domains/organization/application/mappers/organization-output.mapper';

export interface GetPositionsInput {
  search?: string;
}

@Injectable()
export class GetPositionsUseCase implements IUseCase<GetPositionsInput, PositionOutput[]> {
  constructor(
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(input: GetPositionsInput): Promise<PositionOutput[]> {
    const positions = await this.positionRepository.findAll(input.search);
    return positions.map((p) => toPositionOutput(p));
  }
}
