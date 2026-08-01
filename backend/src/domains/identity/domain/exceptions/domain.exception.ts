export abstract class DomainException extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly params?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    params?: Record<string, string>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.params = params;
  }
}
