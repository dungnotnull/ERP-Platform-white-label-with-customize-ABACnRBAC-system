import { User } from "@/shared/@types/user.type.ts";

export enum TransactionType {
  PURCHASE = "purchase",
  ASSIGNMENT = "assignment",
  RETURN = "return",
  MAINTENANCE = "maintenance",
  DISPOSAL = "disposal",
  STATUS_CHANGE = "status_change",
  OTHER = "other"
}

interface DeviceTransaction {
  id: string;
  device: Device;
  deviceId: string;
  transactionType: TransactionType;
  userId?: string;
  performedBy?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface DeviceAssignment {
  id: string;
  device: DeviceType;
  deviceId: string;
  userId: string;
  assignedAt: Date;
  returnedAt?: Date;
  assignmentNotes?: string;
  returnNotes?: string;
  isActive: boolean;
  assignedBy?: string;
  returnedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceType {
  REPAIR = "repair",
  UPGRADE = "upgrade",
  ROUTINE = "routine",
  INSPECTION = "inspection",
  OTHER = "other"
}

export enum MaintenanceStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

interface DeviceMaintenance {
  id: string;
  device: Device;
  deviceId: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date;
  completedDate?: Date;
  performedBy?: string;
  cost?: number;
  description?: string;
  results?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceStatus {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  purchaseDate: Date;
  purchasePrice: string;
  warrantyExpiryDate: Date;
  notes: string;
  deviceType: DeviceType;
  deviceTypeId: string;
  status: DeviceStatus;
  deviceStatusId: string;
  currentAssignment?: {
    userId?: string;
    userName?: string;
    assignedAt?: Date | string;
    assignedBy?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceRequestItem {
  quantity: number;
  deviceType: {
    id: string;
    name: string;
  };
}

interface InternalUser {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
}

interface DeviceRequest {
  reason: string;
  items: DeviceRequestItem[];
  user?: InternalUser;
  id: string;
  userId: string;
  type: string;
  requestedByUserId: string;
  approvedByUserId: string;
  status: string;
  approvedAt: Date;
  completedAt: Date;
  createdAt: Date;
}

export type {
  User,
  DeviceTransaction,
  DeviceAssignment,
  DeviceMaintenance,
  DeviceType,
  DeviceStatus,
  Device,
  DeviceRequest
};
