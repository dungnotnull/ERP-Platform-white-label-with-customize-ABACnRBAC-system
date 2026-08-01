import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { SupplierOutput } from '@/domains/organization/application/dtos/supplier.dtos';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';

export interface GetSupplierInput {
  id: string;
}

@Injectable()
export class GetSupplierUseCase implements IUseCase<GetSupplierInput, SupplierOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: GetSupplierInput): Promise<SupplierOutput> {
    const supplier = await this.supplierRepository.findById(input.id);
    if (!supplier) {
      throw new SupplierNotFoundException(input.id);
    }

    return {
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
    };
  }
}
