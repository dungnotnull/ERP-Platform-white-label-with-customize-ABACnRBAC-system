export interface CreateDeviceTypeInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDeviceTypeInput {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface DeviceTypeOutput {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}
