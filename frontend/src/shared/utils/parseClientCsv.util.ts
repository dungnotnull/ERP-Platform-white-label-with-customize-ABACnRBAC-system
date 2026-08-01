type CsvDelimiter = "," | ";" | "\t";

function countDelimiterOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      count++;
    }
  }

  return count;
}

function detectCsvDelimiter(content: string): CsvDelimiter {
  const firstLine =
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(line => line.length > 0) ?? "";

  if (!firstLine) {
    return ",";
  }

  const counts: Record<CsvDelimiter, number> = {
    ",": countDelimiterOutsideQuotes(firstLine, ","),
    ";": countDelimiterOutsideQuotes(firstLine, ";"),
    "\t": countDelimiterOutsideQuotes(firstLine, "\t")
  };

  const maxCount = Math.max(counts[","], counts[";"], counts["\t"]);
  if (maxCount === 0) {
    return ",";
  }

  const delimiters: CsvDelimiter[] = [",", ";", "\t"];
  return delimiters.find(d => counts[d] === maxCount) ?? ",";
}

function parseCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCsvText(content: string): Record<string, string>[] {
  const normalized = content.replace(/^\uFEFF/, "");
  const delimiter = detectCsvDelimiter(normalized);
  const lines = normalized
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0], delimiter).map(header =>
    header.replace(/^\uFEFF/, "").trim()
  );

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").replace(/^\uFEFF/, "").trim();
    });

    return row;
  });
}

export function getCsvValue(
  row: Record<string, string>,
  keys: string[]
): string | undefined {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])
  );

  for (const key of keys) {
    const value = normalized[key.toLowerCase()];
    if (value !== undefined && value !== "") {
      return value.trim();
    }
  }

  return undefined;
}

function parsePositionLevel(
  positionRaw?: string,
  levelRaw?: string
): number | undefined {
  const raw = levelRaw ?? positionRaw;
  if (!raw) {
    return undefined;
  }

  const asNumber = Number.parseInt(raw, 10);
  if (!Number.isNaN(asNumber) && String(asNumber) === raw.trim()) {
    return asNumber;
  }

  return undefined;
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  return undefined;
}

export interface ImportEmployeeRow {
  name: string;
  email: string;
  employeeCode: string;
  departmentCode?: string;
  departmentName?: string;
  positionLevel?: number;
  positionName?: string;
  isActive?: boolean;
  role?: string;
}

export interface ImportDeviceRow {
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  deviceType?: string;
  deviceStatus?: string;
  supplierId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiryDate?: string;
  notes?: string;
}

export async function parseEmployeeCsvFile(
  file: File
): Promise<ImportEmployeeRow[]> {
  const content = await file.text();
  const rows = parseCsvText(content);

  return rows.map(row => {
    const name = getCsvValue(row, ["name"]);
    const emailRaw = getCsvValue(row, ["email"]);
    const employeeCode = getCsvValue(row, [
      "employeecode",
      "employee_code",
      "employee code"
    ]);

    const departmentCode = getCsvValue(row, [
      "department",
      "departmentcode",
      "department_code"
    ]);
    const departmentName = getCsvValue(row, [
      "departmentname",
      "department_name"
    ]);

    const positionRaw = getCsvValue(row, [
      "position",
      "positionname",
      "position_name"
    ]);
    const levelRaw = getCsvValue(row, [
      "level",
      "position_level",
      "positionlevel"
    ]);
    const positionLevel = parsePositionLevel(positionRaw, levelRaw);
    const positionName =
      positionLevel === undefined
        ? positionRaw
        : getCsvValue(row, ["positionname", "position_name"]);

    const isActiveRaw = getCsvValue(row, ["isactive", "is_active", "active"]);
    const isActive = parseBoolean(isActiveRaw);

    return {
      name: name ?? "",
      email: emailRaw?.trim().toLowerCase() ?? "",
      employeeCode: employeeCode ?? "",
      ...(departmentCode ? { departmentCode } : {}),
      ...(departmentName ? { departmentName } : {}),
      ...(positionLevel !== undefined ? { positionLevel } : {}),
      ...(positionName ? { positionName } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      role: getCsvValue(row, ["role"])
    };
  });
}

export async function parseDeviceCsvFile(
  file: File
): Promise<ImportDeviceRow[]> {
  const content = await file.text();
  const rows = parseCsvText(content);

  return rows.map(row => {
    const purchasePrice = getCsvValue(row, ["purchaseprice", "purchase_price"]);

    return {
      name: getCsvValue(row, ["name"]) ?? "",
      serialNumber: getCsvValue(row, ["serialnumber", "serial_number"]) ?? "",
      model: getCsvValue(row, ["model"]),
      manufacturer: getCsvValue(row, ["manufacturer"]),
      deviceType: getCsvValue(row, ["devicetype", "device_type"]),
      deviceStatus: getCsvValue(row, ["devicestatus", "device_status"]),
      supplierId: getCsvValue(row, ["supplierid", "supplier_id"]),
      purchaseDate: getCsvValue(row, ["purchasedate", "purchase_date"]),
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      warrantyExpiryDate: getCsvValue(row, [
        "warrantyexpirydate",
        "warranty_expiry_date"
      ]),
      notes: getCsvValue(row, ["notes"])
    };
  });
}
