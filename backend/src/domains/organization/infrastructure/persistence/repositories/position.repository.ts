import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import _ from 'lodash';
import { Position, PositionDocument } from '../schemas/position.schema';
import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';
import {
  PositionLookupOptions,
  PositionRepositoryPort,
} from '@/domains/organization/application/ports/repositories/position.repository.port';
import { sanitizeSearchKeyword } from '@/shared/utils/sanitize-search-keyword.util';
import { withNotDeletedFilter } from '@/shared/utils/mongo-active-record-query.util';

@Injectable()
export class PositionRepository implements PositionRepositoryPort {
  constructor(
    @InjectModel(Position.name)
    private readonly model: Model<PositionDocument>,
  ) {}

  async findById(id: string): Promise<PositionEntity | null> {
    if (!this.isValidObjectId(id)) {
      return null;
    }
    const doc = await this.model
      .findOne({ _id: id, ...this.notDeletedFilter() })
      .lean()
      .exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findActiveByName(name: string): Promise<PositionEntity | null> {
    return this.findByName(name, { includeDeleted: false });
  }

  async findActiveByNameVi(nameVi: string): Promise<PositionEntity | null> {
    return this.findByNameVi(nameVi, { includeDeleted: false });
  }

  async findByNameVi(
    nameVi: string,
    options?: PositionLookupOptions,
  ): Promise<PositionEntity | null> {
    const query = withNotDeletedFilter(
      { nameVi },
      this.notDeletedFilter(),
      options?.includeDeleted,
    );

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findByName(
    name: string,
    options?: PositionLookupOptions,
  ): Promise<PositionEntity | null> {
    const query = withNotDeletedFilter(
      { $or: [{ nameVi: name }, { nameJa: name }, { name }] },
      this.notDeletedFilter(),
      options?.includeDeleted,
    );

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findActiveByLevel(level: number): Promise<PositionEntity | null> {
    return this.findByLevel(level, { includeDeleted: false });
  }

  async findByLevel(
    level: number,
    options?: PositionLookupOptions,
  ): Promise<PositionEntity | null> {
    const query: Record<string, unknown> = { level };
    if (!options?.includeDeleted) {
      Object.assign(query, this.notDeletedFilter());
    }

    const doc = await this.model.findOne(query).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findAll(search?: string): Promise<PositionEntity[]> {
    const filter: Record<string, unknown> = { ...this.notDeletedFilter() };
    const term = sanitizeSearchKeyword(search);
    if (!_.isEmpty(term)) {
      filter.$or = [
        { nameVi: { $regex: term, $options: 'i' } },
        { nameJa: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
      ];
    }
    const docs = await this.model
      .find(filter)
      .sort({ level: 1, nameVi: 1 })
      .lean()
      .exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async findByIds(ids: string[]): Promise<PositionEntity[]> {
    const objectIds = [...new Set(ids)]
      .filter((id) => this.isValidObjectId(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return [];
    }

    const docs = await this.model
      .find({ _id: { $in: objectIds }, ...this.notDeletedFilter() })
      .select({ nameVi: 1, nameJa: 1, name: 1, level: 1, isDeleted: 1 })
      .lean()
      .exec();

    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async save(position: PositionEntity): Promise<PositionEntity> {
    const obj = {
      nameVi: position.nameVi,
      nameJa: position.nameJa,
      level: position.level,
      isDeleted: position.isDeleted ?? false,
    };
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(position.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate({ _id: position.id }, obj, { upsert: true, new: true })
        .lean()
        .exec();
      return this.toEntity(doc);
    }
    const doc = await this.model.create(obj);
    return this.toEntity(doc);
  }

  private notDeletedFilter(): Record<string, unknown> {
    return {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };
  }

  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  private toEntity(doc: LeanPosition): PositionEntity {
    const legacyName = doc.name;
    const nameVi = doc.nameVi ?? legacyName ?? '';
    const nameJa = doc.nameJa ?? '';

    return new PositionEntity(String(doc._id), {
      nameVi,
      nameJa,
      level: doc.level ?? null,
      isDeleted: doc.isDeleted ?? false,
    });
  }
}

type LeanPosition = {
  _id: unknown;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  level: number | null;
  isDeleted?: boolean;
};
