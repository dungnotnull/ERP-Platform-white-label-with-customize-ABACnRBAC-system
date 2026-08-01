import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ApiEndpointEntity } from '@/domains/identity/domain/entities/api-endpoint.entity';
import { ApiEndpointRepositoryPort } from '@/domains/identity/application/ports/repositories/api-endpoint.repository.port';
import { ApiEndpointDocument, ApiEndpoint } from '../schemas/api-endpoint.schema';

@Injectable()
export class ApiEndpointRepository implements ApiEndpointRepositoryPort {
  constructor(
    @InjectModel(ApiEndpoint.name) private readonly model: Model<ApiEndpointDocument>,
  ) {}

  private toEntity(doc: ApiEndpointDocument): ApiEndpointEntity {
    return new ApiEndpointEntity(doc.id || doc._id.toString(), {
      method: doc.method,
      pathPattern: doc.pathPattern,
      label: doc.label,
    });
  }

  async upsert(endpoint: ApiEndpointEntity): Promise<ApiEndpointEntity> {
    const doc = await this.model.findOneAndUpdate(
      { method: endpoint.method, pathPattern: endpoint.pathPattern },
      {
        method: endpoint.method,
        pathPattern: endpoint.pathPattern,
        label: endpoint.label,
      },
      { upsert: true, new: true },
    );
    return this.toEntity(doc);
  }

  async findAll(): Promise<ApiEndpointEntity[]> {
    const docs = await this.model.find();
    return docs.map((doc) => this.toEntity(doc));
  }
}
