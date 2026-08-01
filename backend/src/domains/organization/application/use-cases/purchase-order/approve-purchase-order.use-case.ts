import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { ApprovePurchaseOrderInput, PurchaseOrderOutput } from '@/domains/organization/application/dtos/purchase-order.dtos';
import { SupplierRepositoryPort } from '@/domains/organization/application/ports/repositories/supplier.repository.port';
import { DeviceCreationPort } from '@/domains/organization/application/ports/services/device-creation.port';
import { SupplierNotFoundException } from '@/domains/organization/domain/exceptions/supplier-not-found.exception';
import { PurchaseOrderNotFoundException } from '@/domains/organization/domain/exceptions/purchase-order-not-found.exception';
import { PurchaseOrderProps } from '@/domains/organization/domain/entities/purchase-order.entity';
import { canApprove } from '@/domains/organization/domain/policies/purchase-order-approval.policy';

interface PurchaseOrderWithId extends PurchaseOrderProps {
  _id?: string;
}

@Injectable()
export class ApprovePurchaseOrderUseCase implements IUseCase<ApprovePurchaseOrderInput, PurchaseOrderOutput> {
  constructor(
    @Inject('SupplierRepositoryPort') private readonly supplierRepository: SupplierRepositoryPort,
    @Inject('DeviceCreationPort') private readonly deviceCreationPort: DeviceCreationPort,
  ) {}

  async execute(input: ApprovePurchaseOrderInput): Promise<PurchaseOrderOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new SupplierNotFoundException(input.supplierId);
    }

    const orders = supplier.purchaseOrders as unknown as PurchaseOrderWithId[];
    const order = orders.find((o) => String(o._id) === input.orderId);
    if (!order) {
      throw new PurchaseOrderNotFoundException(input.orderId);
    }

    if (!canApprove({ status: order.status, items: order.items })) {
      throw new Error('Purchase order cannot be approved');
    }

    await this.deviceCreationPort.createDevicesFromPurchaseOrder(
      order.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );

    supplier.updatePurchaseOrder(input.orderId, { status: 'approved' });
    await this.supplierRepository.save(supplier);

    const updatedOrders = supplier.purchaseOrders as unknown as PurchaseOrderWithId[];
    const approvedOrder = updatedOrders.find((o) => String(o._id) === input.orderId);

    return {
      id: input.orderId,
      supplierId: supplier.id,
      orderDate: approvedOrder!.orderDate,
      totalAmount: approvedOrder!.totalAmount,
      invoiceNumber: approvedOrder!.invoiceNumber,
      notes: approvedOrder!.notes,
      status: approvedOrder!.status,
      items: approvedOrder!.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
  }
}
