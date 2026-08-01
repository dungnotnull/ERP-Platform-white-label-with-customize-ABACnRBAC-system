import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { PositionNotFoundException } from '@/domains/organization/domain/exceptions/position-not-found.exception';

export interface DeletePositionInput {
  id: string;
}

export interface DeletePositionOutput {
  deleted: boolean;
}

@Injectable()
export class DeletePositionUseCase implements IUseCase<DeletePositionInput, DeletePositionOutput> {
  constructor(
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(input: DeletePositionInput): Promise<DeletePositionOutput> {
    const position = await this.positionRepository.findById(input.id);
    if (!position) {
      throw new PositionNotFoundException(input.id);
    }

    position.softDelete();
    await this.positionRepository.save(position);

    return { deleted: true };
  }
}
