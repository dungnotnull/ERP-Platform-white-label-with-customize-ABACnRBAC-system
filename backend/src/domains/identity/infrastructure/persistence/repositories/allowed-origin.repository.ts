import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AllowedOriginEntity } from '@/domains/identity/domain/entities/allowed-origin.entity';
import { AllowedOriginRepositoryPort } from '@/domains/identity/application/ports/repositories/allowed-origin.repository.port';
import { AllowedOriginDocument, AllowedOrigin } from '../schemas/allowed-origin.schema';

@Injectable()
export class AllowedOriginRepository implements AllowedOriginRepositoryPort {
  constructor(
    @InjectModel(AllowedOrigin.name) private readonly model: Model<AllowedOriginDocument>,
  ) {}

  private toEntity(doc: AllowedOriginDocument): AllowedOriginEntity {
    return new AllowedOriginEntity(doc.id || doc._id.toString(), {
      origin: doc.origin,
      isActive: doc.isActive,
      description: doc.description,
    });
  }

  async findByOrigin(origin: string): Promise<AllowedOriginEntity | null> {
    const doc = await this.model.findOne({ origin });
    return doc ? this.toEntity(doc) : null;
  }

  async findActive(): Promise<AllowedOriginEntity[]> {
    const docs = await this.model.find({ isActive: true });
    return docs.map((doc) => this.toEntity(doc));
  }
}
