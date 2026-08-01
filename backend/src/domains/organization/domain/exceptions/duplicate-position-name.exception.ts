import { DomainException } from './domain.exception';

export class DuplicatePositionNameException extends DomainException {
  constructor(name: string) {
    super(`Position name "${name}" already exists`, 409, 'DUPLICATE_POSITION_NAME', {
      name,
    });
  }
}
