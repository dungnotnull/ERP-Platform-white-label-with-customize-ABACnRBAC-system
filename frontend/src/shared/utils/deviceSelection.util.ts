import type { Device } from "@/shared/@types/assets.type";

export type DeviceSelectionGroup = "usable" | "handed_over";

export function dedupeDevicesById(devices: Device[]): Device[] {
  return [...new Map(devices.map(device => [device.id, device])).values()];
}

export function normalizeDeviceStatusName(
  status?: { name?: string } | string | null
): string {
  if (!status) return "";
  const name = typeof status === "string" ? status : status.name;
  return (name ?? "").trim().toLowerCase();
}

export function getAssignedUserId(device: Device): string | null {
  const userId = device.currentAssignment?.userId;
  return userId != null && userId !== "" ? String(userId) : null;
}

export function isUsableDevice(device: Device): boolean {
  return normalizeDeviceStatusName(device.status) === "usable";
}

export function isHandedOverDevice(device: Device): boolean {
  return normalizeDeviceStatusName(device.status) === "handed_over";
}

export function isSelectableDevice(device: Device): boolean {
  return isUsableDevice(device) || isHandedOverDevice(device);
}

export function getDeviceSelectionGroup(
  device: Device
): DeviceSelectionGroup | null {
  if (isUsableDevice(device)) return "usable";
  if (isHandedOverDevice(device)) return "handed_over";
  return null;
}

function isReturnableGroup(devices: Device[]): boolean {
  if (devices.length === 0 || !devices.every(isHandedOverDevice)) {
    return false;
  }

  const userIds = devices
    .map(getAssignedUserId)
    .filter((id): id is string => Boolean(id));

  if (userIds.length !== devices.length) {
    return false;
  }

  return new Set(userIds).size === 1;
}

export function getAssignableDevices(devices: Device[]): Device[] {
  return devices.filter(
    device => isUsableDevice(device) && !getAssignedUserId(device)
  );
}

export function getReturnableDevices(devices: Device[]): Device[] {
  const handedOver = devices.filter(isHandedOverDevice);
  if (handedOver.length === 0) {
    return [];
  }

  if (isReturnableGroup(handedOver)) {
    return handedOver;
  }

  const baseUserId = getAssignedUserId(handedOver[0]);
  if (!baseUserId) {
    return [];
  }

  const sameAssignee = handedOver.filter(
    device => getAssignedUserId(device) === baseUserId
  );

  return isReturnableGroup(sameAssignee) ? sameAssignee : [];
}

export function canAssignSelection(devices: Device[]): boolean {
  const assignable = getAssignableDevices(devices);
  return assignable.length > 0 && assignable.length === devices.length;
}

export function canReturnSelection(devices: Device[]): boolean {
  const returnable = getReturnableDevices(devices);
  return returnable.length > 0 && returnable.length === devices.length;
}

export function getCommonAssignedUserId(devices: Device[]): string | null {
  if (!canReturnSelection(devices)) return null;
  return getAssignedUserId(devices[0]);
}

export function canAddDeviceToSelection(
  selectedDevices: Device[],
  candidate: Device
): {
  allowed: boolean;
  reason?: "not_selectable" | "mixed_status" | "different_assignee";
} {
  const candidateGroup = getDeviceSelectionGroup(candidate);
  if (!candidateGroup) {
    return { allowed: false, reason: "not_selectable" };
  }

  if (selectedDevices.length === 0) {
    return { allowed: true };
  }

  const firstGroup = getDeviceSelectionGroup(selectedDevices[0]);
  if (firstGroup !== candidateGroup) {
    return { allowed: false, reason: "mixed_status" };
  }

  if (candidateGroup === "handed_over") {
    const baseUserId = getAssignedUserId(selectedDevices[0]);
    const candidateUserId = getAssignedUserId(candidate);
    if (!baseUserId || !candidateUserId || baseUserId !== candidateUserId) {
      return { allowed: false, reason: "different_assignee" };
    }
  }

  return { allowed: true };
}
