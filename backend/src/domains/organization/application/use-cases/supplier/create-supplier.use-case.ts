import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreateSupplierInput, SupplierOutput } from '@/domains/organization/application/dtos/supplier.dtos';
import { SupplierEntity } from '@/domains/organization/domain/entities/supplier.entity';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';

@Injectable()
export class CreateSupplierUseCase implements IUseCase<CreateSupplierInput, SupplierOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: CreateSupplierInput): Promise<SupplierOutput> {
    const supplier = new SupplierEntity('', {
      name: input.name,
      contactPerson: input.contactPerson ?? '',
      phone: input.phone ?? '',
      email: input.email ?? '',
      address: input.address ?? '',
      website: input.website ?? '',
      notes: input.notes ?? '',
      purchaseOrders: [],
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
