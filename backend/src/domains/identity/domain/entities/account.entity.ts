import { Entity } from '@/shared/domain/entity.base';
import { AccountProviderEnumType } from '@/shared/domain/enums/account-provider.enum';

export interface AccountProps {
  userId: string;
  provider: AccountProviderEnumType;
  providerId: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export class AccountEntity extends Entity<AccountProps> {
  get userId(): string {
    return this.props.userId;
  }

  get provider(): AccountProviderEnumType {
    return this.props.provider;
  }

  get providerId(): string {
    return this.props.providerId;
  }

  get refreshToken(): string | undefined {
    return this.props.refreshToken;
  }

  get tokenExpiry(): Date | undefined {
    return this.props.tokenExpiry;
  }

  constructor(id: string, props: AccountProps) {
    super(id, props);
  }

  public isTokenExpired(): boolean {
    if (!this.props.tokenExpiry) {
      return true;
    }
    return this.props.tokenExpiry < new Date();
  }

  public updateRefreshToken(token: string, expiry: Date): void {
    this.props.refreshToken = token;
    this.props.tokenExpiry = expiry;
  }
}
