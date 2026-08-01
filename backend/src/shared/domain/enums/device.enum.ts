export const TransactionTypeEnum = {
  PURCHASE: 'purchase',
  ASSIGNMENT: 'assignment',
  RETURN: 'return',
  MAINTENANCE: 'maintenance',
  DISPOSAL: 'disposal',
  STATUS_CHANGE: 'status_change',
  OTHER: 'other',
} as const;

export type TransactionTypeEnumType =
  (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];

export const MaintenanceTypeEnum = {
  REPAIR: 'repair',
  UPGRADE: 'upgrade',
  ROUTINE: 'routine',
  INSPECTION: 'inspection',
  OTHER: 'other',
} as const;

export type MaintenanceTypeEnumType =
  (typeof MaintenanceTypeEnum)[keyof typeof MaintenanceTypeEnum];

export const MaintenanceStatusEnum = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type MaintenanceStatusEnumType =
  (typeof MaintenanceStatusEnum)[keyof typeof MaintenanceStatusEnum];

export const DeviceRequestTypeEnum = {
  NEW_ASSIGNMENT: 'NEW_ASSIGNMENT',
  REPLACEMENT: 'REPLACEMENT',
  ADDITIONAL: 'ADDITIONAL',
  RETURN: 'RETURN',
  REPAIR: 'REPAIR',
} as const;

export type DeviceRequestTypeEnumType =
  (typeof DeviceRequestTypeEnum)[keyof typeof DeviceRequestTypeEnum];

export const DeviceRequestStatusEnum = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type DeviceRequestStatusEnumType =
  (typeof DeviceRequestStatusEnum)[keyof typeof DeviceRequestStatusEnum];

export const DeviceStatusEnum = {
  DISPOSED: 'disposed',
  BROKEN: 'broken',
  PENDING_REPAIR: 'pending_repair',
  HANDED_OVER: 'handed_over',
  USABLE: 'usable',
  MAINTENANCE: "maintenance",
} as const;

export type DeviceStatusEnumType =
  (typeof DeviceStatusEnum)[keyof typeof DeviceStatusEnum];
  