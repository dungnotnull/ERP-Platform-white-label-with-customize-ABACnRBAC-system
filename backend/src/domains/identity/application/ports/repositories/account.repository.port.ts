import { AccountEntity } from '@/domains/identity/domain/entities/account.entity';

export interface AccountRepositoryPort {
  findByProviderAndProviderId(provider: string, providerId: string): Promise<AccountEntity | null>;
  save(account: AccountEntity): Promise<AccountEntity>;
}
