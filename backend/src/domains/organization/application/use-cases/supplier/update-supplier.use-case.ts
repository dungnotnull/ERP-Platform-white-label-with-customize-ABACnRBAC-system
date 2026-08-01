import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdateSupplierInput, SupplierOutput } from '@/domains/organization/application/dtos/supplier.dtos';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';

@Injectable()
export class UpdateSupplierUseCase implements IUseCase<UpdateSupplierInput, SupplierOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: UpdateSupplierInput): Promise<SupplierOutput> {
    const supplier = await this.supplierRepository.findById(input.id);
    if (!supplier) {
      throw new SupplierNotFoundException(input.id);
    }

    supplier.update({
      name: input.name,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email,
      address: input.address,
      website: input.website,
      notes: input.notes,
    });

    const saved = await this.supplierRepository.save(supplier);

    return {
      id: saved.id,
      name: saved.name,
      contactPerson: saved.contactPerson,
      phone: saved.phone,
      email: saved.email,
      address: saved.address,
      website: saved.website,
      notes: saved.notes,
      purchaseOrders: saved.purchaseOrders,
    };
  }
}
