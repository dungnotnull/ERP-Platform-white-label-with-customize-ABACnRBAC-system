import { DomainException } from './domain.exception';

export class SupplierNotFoundException extends DomainException {
  constructor(supplierId: string) {
    super(`Supplier with id "${supplierId}" not found`, 404, 'SUPPLIER_NOT_FOUND', {
      supplierId,
    });
  }
}
