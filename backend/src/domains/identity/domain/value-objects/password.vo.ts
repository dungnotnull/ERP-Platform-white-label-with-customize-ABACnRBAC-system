import { ValueObject } from '@/shared/domain/value-object.base';

const BCRYPT_REGEX = /^\$2[aby]?\$\d{2}\$.{53}$/;

export class PasswordVo extends ValueObject<string> {
  get value(): string {
    return this.props;
  }

  constructor(hashed: string) {
    super(hashed);
  }

  public isHashed(): boolean {
    return BCRYPT_REGEX.test(this.props);
  }

  public static create(hashed: string): PasswordVo {
    if (!hashed) {
      throw new Error('Password hash is required');
    }
    return new PasswordVo(hashed);
  }
}
