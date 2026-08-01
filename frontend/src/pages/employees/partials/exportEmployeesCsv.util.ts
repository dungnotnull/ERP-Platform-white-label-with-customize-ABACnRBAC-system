import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import {
  extractApiList,
  normalizePaginatedResponse
} from "@/shared/utils/apiResponse.util";

interface ExportUserRow {
  name: string;
  email: string;
  employeeCode: string;
  department?: { id: string; code?: string; name?: string } | null;
  departmentId?: string;
  position?: { id: string; name?: string; level?: number | null } | null;
  positionId?: string;
  isActive: boolean;
  role?: string;
}

interface DepartmentRef {
  id: string;
  code?: string;
}

interface PositionRef {
  id: string;
  name?: string;
  level?: number | null;
}

export type ExportEmployeesProgressStep =
  | "preparing"
  | "fetching"
  | "building"
  | "downloading"
  | "done";

export class ExportEmployeesInProgressError extends Error {
  constructor() {
    super("EXPORT_IN_PROGRESS");
    this.name = "ExportEmployeesInProgressError";
  }
}

let exportEmployeesInFlight = false;

const CSV_HEADERS = [
  "name",
  "email",
  "employeeCode",
  "department",
  "position",
  "isActive"
] as const;

function escapeCsvCell(value: string | number | boolean): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatIsActive(value: boolean): string {
  return value ? "TRUE" : "FALSE";
}

function formatDepartmentCode(code?: string): string {
  return (code ?? "").trim().toLowerCase();
}

function resolvePositionLevel(
  user: ExportUserRow,
  positionById: Map<string, PositionRef>
): string {
  if (user.position?.level !== undefined && user.position?.level !== null) {
    return String(user.position.level);
  }

  const positionId = user.position?.id ?? user.positionId ?? "";
  if (!positionId) {
    return "";
  }

  const ref = positionById.get(positionId);
  if (ref?.level !== undefined && ref?.level !== null) {
    return String(ref.level);
  }

  return "";
}

function rowsToCsvString(rows: Record<string, string>[]): string {
  const lines = [CSV_HEADERS.join(",")];

  for (const row of rows) {
    lines.push(CSV_HEADERS.map(key => escapeCsvCell(row[key] ?? "")).join(","));
  }

  return `${lines.join("\r\n")}\r\n`;
}

function buildLookupMaps(
  departments: DepartmentRef[],
  positions: PositionRef[]
) {
  return {
    departmentById: new Map(
      departments.map(department => [
        department.id,
        formatDepartmentCode(department.code)
      ])
    ),
    positionById: new Map(positions.map(position => [position.id, position]))
  };
}

function mapUsersToCsvRows(
  users: ExportUserRow[],
  departmentById: Map<string, string>,
  positionById: Map<string, PositionRef>
): Record<string, string>[] {
  return users.map(user => {
    const departmentId = user.department?.id ?? user.departmentId ?? "";

    const departmentCode = formatDepartmentCode(
      user.department?.code ?? departmentById.get(departmentId) ?? ""
    );

    return {
      name: user.name ?? "",
      email: (user.email ?? "").trim().toLowerCase(),
      employeeCode: user.employeeCode ?? "",
      department: departmentCode,
      position: resolvePositionLevel(user, positionById),
      isActive: formatIsActive(user.isActive ?? true)
    };
  });
}

async function fetchLookupData(): Promise<{
  departmentById: Map<string, string>;
  positionById: Map<string, PositionRef>;
}> {
  const [departmentsPayload, positionsPayload] = await Promise.all([
    apiClient.get(apiRoutes[ApiRouteNames.DEPARTMENTS], {
      params: { limit: 1000 }
    }),
    apiClient.get(apiRoutes[ApiRouteNames.POSITIONS])
  ]);

  const departments = extractApiList<DepartmentRef>(departmentsPayload);
  const positions = extractApiList<PositionRef>(positionsPayload);

  const { departmentById, positionById } = buildLookupMaps(
    departments,
    positions
  );
  return { departmentById, positionById };
}

async function fetchAllUsers(): Promise<ExportUserRow[]> {
  const usersPayload = await apiClient.get(
    apiRoutes[ApiRouteNames.INTERNAL_USERS],
    { params: { limit: 10000, status: "all" } }
  );

  return normalizePaginatedResponse<ExportUserRow>(usersPayload).items;
}

export async function blobLooksLikeApiJson(blob: Blob): Promise<boolean> {
  const sample = await blob.slice(0, 300).text();
  const trimmed = sample.trim();
  return trimmed.startsWith("{") && trimmed.includes('"success"');
}

export async function blobLooksLikeCsv(blob: Blob): Promise<boolean> {
  const sample = await blob.slice(0, 300).text();
  const firstLine =
    sample
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)[0]
      ?.trim() ?? "";
  return (
    firstLine === CSV_HEADERS.join(",") ||
    firstLine.startsWith("name,email,employeeCode")
  );
}

function parseJsonExportPayload(text: string): ExportUserRow[] {
  const payload = JSON.parse(text) as {
    data?: ExportUserRow[];
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

async function buildCsvBlob(rows: Record<string, string>[]): Promise<Blob> {
  const csv = rowsToCsvString(rows);
  return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
}

async function buildCsvFromJsonBlob(blob: Blob): Promise<Blob> {
  const text = await blob.text();
  const users = parseJsonExportPayload(text);
  const { departmentById, positionById } = await fetchLookupData();
  const rows = mapUsersToCsvRows(users, departmentById, positionById);
  return buildCsvBlob(rows);
}

export async function buildEmployeesCsvFromApi(): Promise<Blob> {
  const [users, { departmentById, positionById }] = await Promise.all([
    fetchAllUsers(),
    fetchLookupData()
  ]);

  const rows = mapUsersToCsvRows(users, departmentById, positionById);
  return buildCsvBlob(rows);
}

function resolveExportFileName(contentDisposition?: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const fallback = `employees_export_${datePart}_${timePart}.csv`;

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

export async function exportEmployeesToCsv(
  onProgress?: (step: ExportEmployeesProgressStep) => void
): Promise<{
  blob: Blob;
  fileName: string;
}> {
  if (exportEmployeesInFlight) {
    throw new ExportEmployeesInProgressError();
  }

  exportEmployeesInFlight = true;
  const report = (step: ExportEmployeesProgressStep) => onProgress?.(step);

  try {
    report("preparing");

    const url =
      apiRoutes[ApiRouteNames.EXPORT_EMPLOYEES] ?? "/internal-users/export";

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

      if (await blobLooksLikeCsv(responseBlob)) {
        const text = await responseBlob.text();
        const normalized = text.replace(/^\uFEFF/, "");
        const firstLine = normalized.split(/\r?\n/)[0]?.trim() ?? "";

        if (firstLine === CSV_HEADERS.join(",")) {
          report("done");
          return {
            blob: new Blob(["\uFEFF", normalized], {
              type: "text/csv;charset=utf-8"
            }),
            fileName
          };
        }
      }
    } catch (error) {
      console.warn("Export endpoint failed, fallback to list API:", error);
    }

    report("building");
    const blob = await buildEmployeesCsvFromApi();
    report("done");
    return { blob, fileName: resolveExportFileName() };
  } finally {
    exportEmployeesInFlight = false;
  }
}
