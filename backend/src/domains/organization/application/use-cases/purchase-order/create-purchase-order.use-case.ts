import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { CreatePurchaseOrderInput, PurchaseOrderOutput } from '@/domains/organization/application/dtos/purchase-order.dtos';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';
import { v4 as uuidv4 } from 'uuid';

interface PurchaseOrderWithId {
  _id?: string;
  orderDate: Date;
  totalAmount: number;
  invoiceNumber: string;
  notes: string;
  status: string;
  items: Array<{
    deviceTypeId: string;
    deviceName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable()
export class CreatePurchaseOrderUseCase implements IUseCase<CreatePurchaseOrderInput, PurchaseOrderOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
  ) {}

  async execute(input: CreatePurchaseOrderInput): Promise<PurchaseOrderOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new SupplierNotFoundException(input.supplierId);
    }

    const items = input.items.map((item) => ({
      deviceTypeId: item.deviceTypeId,
      deviceName: item.deviceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const orderProps = {
      orderDate: new Date(),
      totalAmount,
      invoiceNumber: input.invoiceNumber ?? '',
      notes: input.notes ?? '',
      status: 'draft',
      items,
    };

    supplier.addPurchaseOrder(orderProps);
    await this.supplierRepository.save(supplier);

    const savedOrders = supplier.purchaseOrders;
    const savedOrder = savedOrders[savedOrders.length - 1] as unknown as PurchaseOrderWithId;

    const orderId = savedOrder._id ?? uuidv4();

    return {
      id: orderId,
      supplierId: supplier.id,
      orderDate: savedOrder.orderDate,
      totalAmount: savedOrder.totalAmount,
      invoiceNumber: savedOrder.invoiceNumber,
      notes: savedOrder.notes,
      status: savedOrder.status,
      items: savedOrder.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
  }
}
