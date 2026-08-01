import { ValueObject } from '@/shared/domain/value-object.base';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export class EmailVo extends ValueObject<string> {
  get value(): string {
    return this.props;
  }

  constructor(email: string) {
    super(email);
  }

  public static create(email: string): EmailVo {
    const trimmed = email?.trim().toLowerCase() || '';
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      throw new Error(`Invalid email format: "${email}"`);
    }
    return new EmailVo(trimmed);
  }
}
