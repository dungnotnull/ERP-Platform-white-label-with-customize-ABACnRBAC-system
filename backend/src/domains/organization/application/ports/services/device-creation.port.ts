export interface DeviceCreationItem {
  deviceTypeId: string;
  deviceName: string;
  quantity: number;
  unitPrice: number;
}

export interface DeviceCreationPort {
  createDevicesFromPurchaseOrder(items: DeviceCreationItem[]): Promise<string[]>;
}
