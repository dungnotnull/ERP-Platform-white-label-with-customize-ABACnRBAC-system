export interface DeviceRequestItemInput {
  deviceTypeId: string;
  quantity: number;
}

export interface DeviceRequestDeviceInput {
  oldDeviceId: string;
  newDeviceId: string;
}

export interface CreateDeviceRequestInput {
  type: string;
  userId: string;
  requestedByUserId: string;
  reason?: string;
  items?: DeviceRequestItemInput[];
  replacementDevices?: DeviceRequestDeviceInput[];
}

export interface UpdateDeviceRequestInput {
  id: string;
  type?: string;
  reason?: string;
  items?: DeviceRequestItemInput[];
  replacementDevices?: DeviceRequestDeviceInput[];
}

export interface ApproveRequestInput {
  id: string;
  approvedBy: string;
}

export interface DeviceRequestOutput {
  id: string;
  type: string;
  status: string;
  userId: string;
  requestedByUserId: string;
  reason: string;
  approvedByUserId?: string;
  approvedAt?: Date;
  completedAt?: Date;
  items: Record<string, unknown>[];
  replacementDevices: Record<string, unknown>[];
}

export interface PaginatedRequestsOutput {
  items: DeviceRequestOutput[];
  total: number;
  page: number;
  limit: number;
}
