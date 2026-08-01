export interface Filters {
  name: string;
  contactPerson: string;
  search: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  notes: string;
  updatedAt: string;
  //   isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName?: string;

  orderDate: string; // ISO date 'YYYY-MM-DD'
  invoiceNumber?: string | null; // tương ứng invoiceNumber column
  notes?: string | null;
  items: Array<{
    id: string;
    deviceTypeId: string;
    deviceName?: string;
    quantity: number;
    unitPrice: number;
  }>;

  deviceName?: string;
  supplier: any;

  totalAmount: number;
  status?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderFilters {
  invoiceNumber?: string;
  supplierName?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
