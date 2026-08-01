export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface UpdateSupplierInput {
  id: string;
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface SupplierOutput {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  notes: string;
  purchaseOrders: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedSuppliersOutput {
  items: SupplierOutput[];
  total: number;
  page: number;
  limit: number;
}
