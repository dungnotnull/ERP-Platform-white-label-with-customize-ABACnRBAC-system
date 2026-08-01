import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';

import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';

import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';

@Injectable()
export class DeleteSupplierUseCase
  implements IUseCase<string, void>
{
  constructor(
    @Inject('SupplierRepositoryPort')
    private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const supplier = await this.supplierRepository.findById(id);

    if (!supplier) {
      throw new SupplierNotFoundException(id);
    }

    await this.supplierRepository.delete(id);
  }
}