export interface CreateDeviceInput {
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  deviceTypeId: string;
  deviceStatusId: string;
  supplierId?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiryDate?: Date;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDeviceInput {
  id: string;
  name?: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  deviceTypeId?: string;
  deviceStatusId?: string;
  supplierId?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiryDate?: Date;
  notes?: string;
  updatedBy?: string;
}

export interface DeviceOutput {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  deviceTypeId: string;
  deviceStatusId: string;
  supplierId?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiryDate?: Date;
  notes: string;
  isDeleted: boolean;
  currentAssignment: Record<string, unknown> | null;
  assignmentHistory: Record<string, unknown>[];
  maintenanceRecords: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  createdBy?: string;
  updatedBy?: string;
}

export interface DeviceStatisticsOutput {
  totalDevices: number;
  activeDevices: number;
  assignedDevices: number;
  availableDevices: number;
  devicesByType: Record<string, number>;
  devicesByStatus: Record<string, number>;
}

export interface PaginatedDevicesOutput {
  items: DeviceOutput[];
  total: number;
  page: number;
  limit: number;
}

export interface DeviceFilterInput {
  search?: string;
  deviceTypeId?: string;
  deviceStatusId?: string;
  supplierId?: string;
  isDeleted?: boolean;
  assignedUserId?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
