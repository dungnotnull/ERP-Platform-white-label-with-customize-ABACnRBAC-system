import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PaginatedSuppliersOutput, SupplierOutput } from '@/domains/organization/application/dtos/supplier.dtos';
import { SupplierRepositoryPort, SupplierFilterInput } from '@/domains/organization/application/ports/repositories/supplier.repository.port';

export interface GetSuppliersInput {
  filter?: SupplierFilterInput;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetSuppliersUseCase implements IUseCase<GetSuppliersInput, PaginatedSuppliersOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: GetSuppliersInput): Promise<PaginatedSuppliersOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const filter: SupplierFilterInput = {
      search: input.filter?.search,
      sort: input.filter?.sort,
      order: input.filter?.order,
    };

    const result = await this.supplierRepository.findPaginated(filter, page, limit);

    const items: SupplierOutput[] = result.items.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      website: supplier.website,
      notes: supplier.notes,
      purchaseOrders: supplier.purchaseOrders,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }));

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
