import {
  extractApiList,
  normalizePaginatedResponse as normalizePaginatedResponseBase,
  PaginatedTableResponse
} from "@/shared/utils/apiResponse.util";
import { DeviceRequestStatus } from "@/shared/enums/assets.enum";

export type { PaginatedTableResponse };

const LEGACY_REQUEST_TYPE_MAP: Record<string, string> = {
  NEW_ASSIGNMENT: "NEW",
  ADDITIONAL: "NEW",
  REPLACEMENT: "REPLACE",
  REPLACE: "REPLACE",
  REPAIR: "REPAIR",
  RETURN: "REPAIR",
  NEW: "NEW"
};

const LEGACY_STATUS_MAP: Record<string, string> = {
  APPROVED: DeviceRequestStatus.APPROVED,
  PENDING: DeviceRequestStatus.PENDING,
  REJECTED: DeviceRequestStatus.REJECTED,
  COMPLETED: DeviceRequestStatus.COMPLETED,
  CANCELLED: "cancelled",
  approve: DeviceRequestStatus.APPROVED,
  pending: DeviceRequestStatus.PENDING,
  rejected: DeviceRequestStatus.REJECTED,
  completed: DeviceRequestStatus.COMPLETED
};

export function normalizePaginatedResponse<T>(
  payload: unknown
): PaginatedTableResponse<T> {
  return normalizePaginatedResponseBase<T>(payload);
}

function normalizeRequestType(type: unknown): string {
  if (typeof type !== "string") {
    return "NEW";
  }

  return (
    LEGACY_REQUEST_TYPE_MAP[type] ??
    LEGACY_REQUEST_TYPE_MAP[type.toUpperCase()] ??
    type
  );
}

function normalizeRequestStatus(status: unknown): string {
  if (typeof status !== "string") {
    return DeviceRequestStatus.PENDING;
  }

  return (
    LEGACY_STATUS_MAP[status] ??
    LEGACY_STATUS_MAP[status.toUpperCase()] ??
    status.toLowerCase()
  );
}

function normalizeRequestItems(
  items: unknown
): Array<{ quantity: number; deviceType: { id: string; name: string } }> {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(item => {
    const record = item as Record<string, unknown>;
    const deviceType = record.deviceType as
      | { id?: string; name?: string }
      | undefined;
    const deviceTypeId = String(record.deviceTypeId ?? deviceType?.id ?? "");

    return {
      quantity: Number(record.quantity ?? 0),
      deviceType: {
        id: deviceTypeId,
        name: String(deviceType?.name ?? deviceTypeId)
      }
    };
  });
}

export function normalizeDeviceRequests<T>(payload: unknown): T[] {
  return extractApiList<Record<string, unknown>>(payload).map(request => ({
    ...request,
    type: normalizeRequestType(request.type),
    status: normalizeRequestStatus(request.status),
    items: normalizeRequestItems(request.items)
  })) as T[];
}
