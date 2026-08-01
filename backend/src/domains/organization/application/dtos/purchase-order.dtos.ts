export interface PurchaseOrderItemInput {
  deviceTypeId: string;
  deviceName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  invoiceNumber?: string;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export interface UpdatePurchaseOrderInput {
  supplierId: string;
  orderId: string;
  invoiceNumber?: string;
  notes?: string;
  status?: string;
  items?: PurchaseOrderItemInput[];
}

export interface ApprovePurchaseOrderInput {
  supplierId: string;
  orderId: string;
}

export interface PurchaseOrderItemOutput {
  deviceTypeId: string;
  deviceName: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderOutput {
  id: string;
  supplierId: string;
  orderDate: Date;
  totalAmount: number;
  invoiceNumber: string;
  notes: string;
  status: string;
  items: PurchaseOrderItemOutput[];
}
