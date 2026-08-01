export interface CreateMaintenanceInput {
  deviceId: string;
  maintenanceType: string;
  status: string;
  scheduledDate: Date;
  cost?: number;
  description?: string;
}

export interface UpdateMaintenanceInput {
  deviceId: string;
  maintenanceIndex: number;
  maintenanceType?: string;
  status?: string;
  scheduledDate?: Date;
  cost?: number;
  description?: string;
}

export interface MaintenanceOutput {
  id: string;
  maintenanceRecords: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
}
