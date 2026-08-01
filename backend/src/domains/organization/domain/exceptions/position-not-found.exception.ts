import { DomainException } from './domain.exception';

export class PositionNotFoundException extends DomainException {
  constructor(positionId: string) {
    super(
      `Position with id "${positionId}" not found`,
      404,
      'POSITION_NOT_FOUND',
      { id: positionId },
    );
  }
}
