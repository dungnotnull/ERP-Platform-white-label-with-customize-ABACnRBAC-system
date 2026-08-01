import { DomainException } from './domain.exception';

export class ImportRowValidationException extends DomainException {
  constructor(
    message: string,
    errorCode: string,
    params?: Record<string, string>,
  ) {
    super(message, 400, errorCode, params);
  }
}
