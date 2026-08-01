export interface CreateDeviceStatusInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDeviceStatusInput {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface DeviceStatusOutput {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}
