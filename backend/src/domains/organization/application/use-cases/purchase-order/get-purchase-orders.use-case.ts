import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PurchaseOrderOutput } from '@/domains/organization/application/dtos/purchase-order.dtos';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';
import { PurchaseOrderProps } from '@/domains/organization/domain/entities/purchase-order.entity';

interface PurchaseOrderWithId extends PurchaseOrderProps {
  _id?: string;
}

export interface GetPurchaseOrdersInput {
  supplierId: string;
}

@Injectable()
export class GetPurchaseOrdersUseCase implements IUseCase<GetPurchaseOrdersInput, PurchaseOrderOutput[]> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: GetPurchaseOrdersInput): Promise<PurchaseOrderOutput[]> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new SupplierNotFoundException(input.supplierId);
    }

    const orders = supplier.purchaseOrders as unknown as PurchaseOrderWithId[];

    return orders.map((order) => ({
      id: String(order._id ?? ''),
      supplierId: supplier.id,
      orderDate: order.orderDate,
      totalAmount: order.totalAmount,
      invoiceNumber: order.invoiceNumber,
      notes: order.notes,
      status: order.status,
      items: order.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }));
  }
}
