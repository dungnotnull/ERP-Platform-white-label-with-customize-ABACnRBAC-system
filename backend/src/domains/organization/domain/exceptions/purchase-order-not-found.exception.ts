import { DomainException } from './domain.exception';

export class PurchaseOrderNotFoundException extends DomainException {
  constructor(orderId: string) {
    super(`Purchase order with id "${orderId}" not found`, 404);
  }
}
