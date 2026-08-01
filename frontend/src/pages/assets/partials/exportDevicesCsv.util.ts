import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { extractApiList } from "@/shared/utils/apiResponse.util";

export interface ExportDeviceRow {
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  deviceTypeId?: string;
  deviceStatusId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiryDate?: string;
  notes?: string;
}

interface DeviceTypeRef {
  id: string;
  name?: string;
}

interface DeviceStatusRef {
  id: string;
  name?: string;
}

export type ExportDevicesProgressStep =
  | "preparing"
  | "fetching"
  | "building"
  | "downloading"
  | "done";

export class ExportDevicesInProgressError extends Error {
  constructor() {
    super("EXPORT_IN_PROGRESS");
    this.name = "ExportDevicesInProgressError";
  }
}

let exportDevicesInFlight = false;

const CSV_HEADERS = [
  "name",
  "serialNumber",
  "model",
  "manufacturer",
  "deviceType",
  "deviceStatus",
  "purchaseDate",
  "purchasePrice",
  "warrantyExpiryDate",
  "notes"
] as const;

function escapeCsvCell(value: string | number | boolean): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Column serialNumber: leading tab + quotes so Excel keeps numeric serials as text. */
function escapeSerialNumberForExcel(serial: string): string {
  const text = String(serial).replace(/"/g, '""');
  return `"\t${text}"`;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function rowsToCsvString(rows: Record<string, string>[]): string {
  const lines = [CSV_HEADERS.join(",")];

  for (const row of rows) {
    lines.push(
      CSV_HEADERS.map(key =>
        key === "serialNumber"
          ? escapeSerialNumberForExcel(row[key] ?? "")
          : escapeCsvCell(row[key] ?? "")
      ).join(",")
    );
  }

  return `${lines.join("\r\n")}\r\n`;
}

async function fetchLookupData(): Promise<{
  typeById: Map<string, string>;
  statusById: Map<string, string>;
}> {
  const [typesPayload, statusesPayload] = await Promise.all([
    apiClient.get(apiRoutes[ApiRouteNames.DEVICE_TYPES]),
    apiClient.get(apiRoutes[ApiRouteNames.DEVICE_STATUSES])
  ]);

  const types = extractApiList<DeviceTypeRef>(typesPayload);
  const statuses = extractApiList<DeviceStatusRef>(statusesPayload);

  return {
    typeById: new Map(types.map(type => [type.id, type.name ?? ""])),
    statusById: new Map(statuses.map(status => [status.id, status.name ?? ""]))
  };
}

function mapDevicesToCsvRows(
  devices: ExportDeviceRow[],
  typeById: Map<string, string>,
  statusById: Map<string, string>
): Record<string, string>[] {
  return devices.map(device => ({
    name: device.name ?? "",
    serialNumber: device.serialNumber ?? "",
    model: device.model ?? "",
    manufacturer: device.manufacturer ?? "",
    deviceType: typeById.get(device.deviceTypeId ?? "") ?? "",
    deviceStatus: statusById.get(device.deviceStatusId ?? "") ?? "",
    purchaseDate: formatDate(device.purchaseDate),
    purchasePrice:
      device.purchasePrice !== undefined && device.purchasePrice !== null
        ? String(device.purchasePrice)
        : "",
    warrantyExpiryDate: formatDate(device.warrantyExpiryDate),
    notes: device.notes ?? ""
  }));
}

async function buildCsvBlob(rows: Record<string, string>[]): Promise<Blob> {
  const csv = rowsToCsvString(rows);
  return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
}

async function blobLooksLikeApiJson(blob: Blob): Promise<boolean> {
  const sample = await blob.slice(0, 300).text();
  const trimmed = sample.trim();
  return trimmed.startsWith("{") && trimmed.includes('"success"');
}

function parseJsonExportPayload(text: string): ExportDeviceRow[] {
  const payload = JSON.parse(text) as {
    data?: ExportDeviceRow[];
    success?: boolean;
  };

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

async function buildCsvFromJsonBlob(blob: Blob): Promise<Blob> {
  const devices = parseJsonExportPayload(await blob.text());
  const { typeById, statusById } = await fetchLookupData();
  const rows = mapDevicesToCsvRows(devices, typeById, statusById);
  return buildCsvBlob(rows);
}

async function buildCsvFromDevices(devices: ExportDeviceRow[]): Promise<Blob> {
  const { typeById, statusById } = await fetchLookupData();
  const rows = mapDevicesToCsvRows(devices, typeById, statusById);
  return buildCsvBlob(rows);
}

async function fetchDevicesFromExportApi(): Promise<ExportDeviceRow[]> {
  const url = apiRoutes[ApiRouteNames.EXPORT_DEVICES] ?? "/devices/export";
  const payload = await apiClient.get<
    ExportDeviceRow[] | { items: ExportDeviceRow[] }
  >(url);

  if (Array.isArray(payload)) {
    return payload;
  }

  return extractApiList<ExportDeviceRow>(payload);
}

function resolveExportFileName(contentDisposition?: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const fallback = `devices_export_${datePart}_${timePart}.csv`;

  if (!contentDisposition) {
    return fallback;
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (match?.[1]) {
    const name = decodeURIComponent(match[1].trim());
    return name.toLowerCase().endsWith(".csv") ? name : `${name}.csv`;
  }

  return fallback;
}

export async function exportDevicesToCsv(
  onProgress?: (step: ExportDevicesProgressStep) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (exportDevicesInFlight) {
    throw new ExportDevicesInProgressError();
  }

  exportDevicesInFlight = true;
  const report = (step: ExportDevicesProgressStep) => onProgress?.(step);

  try {
    report("preparing");

    const url = apiRoutes[ApiRouteNames.EXPORT_DEVICES] ?? "/devices/export";

    report("fetching");

    try {
      const response = await apiClient.getBlob(url);
      const responseBlob = response.data;
      const contentDisposition = (response.headers["content-disposition"] ??
        response.headers["Content-Disposition"]) as string | undefined;
      const fileName = resolveExportFileName(contentDisposition);

      if (await blobLooksLikeApiJson(responseBlob)) {
        report("building");
        const blob = await buildCsvFromJsonBlob(responseBlob);
        report("done");
        return { blob, fileName };
      }

      const sample = await responseBlob.slice(0, 80).text();
      if (sample.trim() && !sample.trim().startsWith("{")) {
        report("done");
        return { blob: responseBlob, fileName };
      }
    } catch (error) {
      console.warn("Export blob request failed, fallback to JSON API:", error);
    }

    report("building");
    const devices = await fetchDevicesFromExportApi();
    const blob = await buildCsvFromDevices(devices);
    report("done");
    return { blob, fileName: resolveExportFileName() };
  } finally {
    exportDevicesInFlight = false;
  }
}
