import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import _ from 'lodash';
import { Supplier, SupplierDocument } from '../schemas/supplier.schema';
import { SupplierEntity } from '@/domains/organization/domain/entities/supplier.entity';
import {
  SupplierRepositoryPort,
  SupplierFilterInput,
} from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { PaginatedResult } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { sanitizeSearchKeywordForRegex } from '@/shared/utils/sanitize-search-keyword.util';

@Injectable()
export class SupplierRepository implements SupplierRepositoryPort {
  constructor(
    @InjectModel(Supplier.name)
    private readonly model: Model<SupplierDocument>,
  ) {}

  async findById(id: string): Promise<SupplierEntity | null> {
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findPaginated(
    filter: SupplierFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<SupplierEntity>> {
    const query = this.buildFilter(filter);
    const sort = this.buildSort(filter.sort, filter.order);
    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return {
      items: _.map(docs, (doc) => this.toEntity(doc)),
      total,
      page,
      limit,
    };
  }

  async save(supplier: SupplierEntity): Promise<SupplierEntity> {
    const obj = supplier.toPlainObject();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(supplier.id);
    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate({ _id: supplier.id }, obj, { upsert: true, new: true })
        .lean()
        .exec();
      return this.toEntity(doc);
    }
    const doc = await this.model.create(obj);
    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  private buildSort(
    sortField?: string,
    order?: 'asc' | 'desc',
  ): Record<string, 1 | -1> {
    const allowed: Record<string, string> = {
      name: 'name',
      contactPerson: 'contactPerson',
      phone: 'phone',
      email: 'email',
      updatedAt: 'updatedAt',
      createdAt: 'createdAt',
    };
    const field = allowed[sortField ?? ''] ?? 'name';
    const direction: 1 | -1 = order === 'asc' ? 1 : -1;
    return { [field]: direction };
  }

  private buildFilter(filter: SupplierFilterInput): Record<string, unknown> {
    const pattern = sanitizeSearchKeywordForRegex(filter.search);
    if (!_.isEmpty(pattern)) {
      return {
        $or: [
          { name: { $regex: pattern, $options: 'i' } },
          { contactPerson: { $regex: pattern, $options: 'i' } },
          { email: { $regex: pattern, $options: 'i' } },
          { phone: { $regex: pattern, $options: 'i' } },
        ],
      };
    }
    return {};
  }

  private toEntity(doc: LeanSupplier): SupplierEntity {
    return new SupplierEntity(String(doc._id), {
      name: doc.name,
      contactPerson: doc.contactPerson ?? '',
      phone: doc.phone ?? '',
      email: doc.email ?? '',
      address: doc.address ?? '',
      website: doc.website ?? '',
      notes: doc.notes ?? '',
      purchaseOrders: _.map(doc.purchaseOrders ?? [], (po) => ({
        orderDate: po.orderDate ?? new Date(),
        totalAmount: po.totalAmount ?? 0,
        invoiceNumber: po.invoiceNumber ?? '',
        notes: po.notes ?? '',
        status: po.status ?? 'draft',
        items: _.map(po.items ?? [], (item) => ({
          deviceTypeId: String(item.deviceTypeId ?? ''),
          deviceName: item.deviceName ?? '',
          quantity: item.quantity ?? 0,
          unitPrice: item.unitPrice ?? 0,
        })),
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

type LeanSupplier = {
  _id: unknown;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  notes?: string;
  purchaseOrders?: {
    orderDate?: Date;
    totalAmount?: number;
    invoiceNumber?: string;
    notes?: string;
    status?: string;
    items?: {
      deviceTypeId?: unknown;
      deviceName?: string;
      quantity?: number;
      unitPrice?: number;
    }[];
  }[];
  createdAt?: Date;
  updatedAt?: Date;
};
