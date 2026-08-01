import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UpdatePurchaseOrderInput, PurchaseOrderOutput } from '@/domains/organization/application/dtos/purchase-order.dtos';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';
import { PurchaseOrderNotFoundException } from '@/domains/organization/domain/exceptions/purchase-order-not-found.exception';
import { PurchaseOrderProps } from '@/domains/organization/domain/entities/purchase-order.entity';

interface PurchaseOrderWithId extends PurchaseOrderProps {
  _id?: string;
}

@Injectable()
export class UpdatePurchaseOrderUseCase implements IUseCase<UpdatePurchaseOrderInput, PurchaseOrderOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: UpdatePurchaseOrderInput): Promise<PurchaseOrderOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new SupplierNotFoundException(input.supplierId);
    }

    const orders = supplier.purchaseOrders as unknown as PurchaseOrderWithId[];
    const order = orders.find((o) => String(o._id) === input.orderId);
    if (!order) {
      throw new PurchaseOrderNotFoundException(input.orderId);
    }

    const updates: Partial<PurchaseOrderProps> = {};
    if (input.invoiceNumber !== undefined) {
      updates.invoiceNumber = input.invoiceNumber;
    }
    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }
    if (input.status !== undefined) {
      updates.status = input.status;
    }
    if (input.items !== undefined) {
      const mappedItems = input.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      updates.items = mappedItems;
      updates.totalAmount = mappedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
    }

    supplier.updatePurchaseOrder(input.orderId, updates);
    await this.supplierRepository.save(supplier);

    const updatedOrders = supplier.purchaseOrders as unknown as PurchaseOrderWithId[];
    const updatedOrder = updatedOrders.find((o) => String(o._id) === input.orderId);

    return {
      id: input.orderId,
      supplierId: supplier.id,
      orderDate: updatedOrder!.orderDate,
      totalAmount: updatedOrder!.totalAmount,
      invoiceNumber: updatedOrder!.invoiceNumber,
      notes: updatedOrder!.notes,
      status: updatedOrder!.status,
      items: updatedOrder!.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
  }
}
