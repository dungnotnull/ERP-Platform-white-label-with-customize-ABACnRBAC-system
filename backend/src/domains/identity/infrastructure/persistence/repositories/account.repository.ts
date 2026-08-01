import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AccountEntity } from '@/domains/identity/domain/entities/account.entity';
import { AccountRepositoryPort } from '@/domains/identity/application/ports/repositories/account.repository.port';
import { AccountDocument, Account } from '../schemas/account.schema';

@Injectable()
export class AccountRepository implements AccountRepositoryPort {
  constructor(
    @InjectModel(Account.name) private readonly model: Model<AccountDocument>,
  ) {}

  private toEntity(doc: AccountDocument): AccountEntity {
    return new AccountEntity(doc.id || doc._id.toString(), {
      userId: doc.userId?.toString(),
      provider: doc.provider as any,
      providerId: doc.providerId,
      refreshToken: doc.refreshToken,
      tokenExpiry: doc.tokenExpiry,
    });
  }

  private toObject(entity: AccountEntity): Record<string, any> {
    return {
      userId: entity.userId,
      provider: entity.provider,
      providerId: entity.providerId,
      refreshToken: entity.refreshToken,
      tokenExpiry: entity.tokenExpiry,
    };
  }

  async findByProviderAndProviderId(
    provider: string,
    providerId: string,
  ): Promise<AccountEntity | null> {
    const doc = await this.model.findOne({ provider, providerId });
    return doc ? this.toEntity(doc) : null;
  }

  async save(account: AccountEntity): Promise<AccountEntity> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(account.id);
    if (isObjectId) {
      const doc = await this.model.findOneAndUpdate(
        { _id: account.id },
        this.toObject(account),
        { upsert: true, new: true },
      );
      return this.toEntity(doc);
    }

    const doc = await this.model.create(this.toObject(account));
    return this.toEntity(doc);
  }
}
