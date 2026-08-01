import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { IUseCase } from "@/shared/application/use-case.interface";
import { DeviceEntity } from "@/domains/asset/domain/entities/device.entity";
import { DeviceRepositoryPort } from "@/domains/asset/application/ports/repositories/device.repository.port";
import { DeviceStatusEnum } from "@/shared/domain/enums/device.enum";
import {
  getCsvValue,
  parseCsvBuffer,
} from "@/shared/infrastructure/utils/csv.util";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  buildLocalizedErrorPayload,
  resolveApiErrorMessage,
} from "@/shared/infrastructure/i18n/api-error.messages";
import type { AppLocale } from "@/shared/infrastructure/i18n/parse-request-locale";

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

export interface ImportDevicesInput {
  fileBuffer?: Buffer;
  rows?: ImportDeviceRow[];
  createdBy?: string;
  locale?: AppLocale;
}

interface ImportRowErrorDescriptor {
  errorCode: string;
  params: Record<string, string>;
}

export type ImportDeviceSkipReason = "duplicate" | "handed_over" | "invalid_status" | "invalid_device_type";

export interface ImportDeviceSkippedItem {
  serialNumber: string;
  name: string;
  reason: ImportDeviceSkipReason;
}

export interface ImportDevicesOutput {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  skippedSerialNumbers: string[];
  skippedItems: ImportDeviceSkippedItem[];
}

@Injectable()
export class ImportDevicesUseCase implements IUseCase<
  ImportDevicesInput,
  ImportDevicesOutput
> {
  constructor(
    @Inject("DeviceRepositoryPort")
    private readonly deviceRepository: DeviceRepositoryPort,

    @InjectModel("DeviceType")
    private readonly deviceTypeModel: Model<any>,

    @InjectModel("DeviceStatus")
    private readonly deviceStatusModel: Model<any>,
  ) {}

  async execute(input: ImportDevicesInput): Promise<ImportDevicesOutput> {
    const locale = input.locale ?? 'vi';

    if (!input.fileBuffer && !input.rows?.length) {
      throw new BadRequestException(
        buildLocalizedErrorPayload('IMPORT_DATA_REQUIRED', {}, locale),
      );
    }

    const rows = input.rows ?? (await this.parseCsv(input.fileBuffer!));
    const rowErrors: ImportRowErrorDescriptor[] = [];

    const skippedItems: ImportDeviceSkippedItem[] = [];
    const seenSerialNumbers = new Set<string>();
    // const devices: DeviceEntity[] = [];
    const devicesToInsert: DeviceEntity[] = [];
    const devicesToUpdate: DeviceEntity[] = [];
    const handedOverStatus = await this.deviceStatusModel.findOne({
      name: DeviceStatusEnum.HANDED_OVER,
    });

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;

      // Skip completely empty rows
      const isEmptyRow = Object.values(row).every(
        (value) =>
          value === undefined ||
          value === null ||
          String(value).trim() === "",
      );

      if (isEmptyRow) {
        continue;
      }

      const serialNumber = row.serialNumber?.toUpperCase().trim();
      const name = row.name?.trim();
      const model = row.model?.trim();
      const manufacturer = row.manufacturer?.trim();
      const deviceType = row.deviceType?.trim();
      if (!deviceType) {
        skippedItems.push({
          serialNumber: serialNumber || "",
          name: name || "",
          reason: "invalid_device_type",
        });

        continue;
      }

      const deviceStatus = row.deviceStatus?.trim();
      if (!deviceStatus) {
        skippedItems.push({
          serialNumber: serialNumber || "",
          name: name || "",
          reason: "invalid_status",
        });

        continue;
      }
      const notes = row.notes?.trim();

      if (!serialNumber || !name) {
        rowErrors.push({
          errorCode: 'IMPORT_DEVICE_MISSING_REQUIRED_FIELDS',
          params: { rowNumber: String(rowNumber) },
        });
        continue;
      }

      const normalizedStatus = deviceStatus?.toLowerCase();
      if (normalizedStatus === DeviceStatusEnum.HANDED_OVER) {
        skippedItems.push({ serialNumber, name, reason: "handed_over" });
        continue;
      }

      if (seenSerialNumbers.has(serialNumber)) {
        skippedItems.push({ serialNumber, name, reason: "duplicate" });
        continue;
      }

      // const exists = await this.deviceRepository.existsBySerialNumber(serialNumber);

      // if (exists) {
      //   skippedItems.push({ serialNumber, name, reason: "duplicate" });
      //   continue;
      // }
      const existingDevice = await this.deviceRepository.findBySerialNumber( serialNumber, );

      seenSerialNumbers.add(serialNumber);

      const isCurrentHandedOver =
        !!existingDevice &&
        !!handedOverStatus &&
        existingDevice.deviceStatusId?.toString() === handedOverStatus._id.toString();

      const deviceTypeDoc = await this.deviceTypeModel.findOne({
        name: deviceType,
      });
      if(!deviceTypeDoc) {
        skippedItems.push({
          serialNumber,
          name,
          reason: "invalid_device_type",
        });
        continue;
      }

      const deviceStatusDoc = await this.deviceStatusModel.findOne({
        name: deviceStatus,
      });

      if (!deviceStatusDoc) {
        skippedItems.push({
          serialNumber,
          name,
          reason: "invalid_status",
        });

        continue;
      }

      const finalDeviceStatusId = isCurrentHandedOver
        ? existingDevice.deviceStatusId
        : deviceStatusDoc._id;

      if (row.purchaseDate && isNaN(new Date(row.purchaseDate).getTime())) {
        rowErrors.push({
          errorCode: 'IMPORT_DEVICE_INVALID_PURCHASE_DATE',
          params: { rowNumber: String(rowNumber) },
        });
        continue;
      }

      if (
        row.warrantyExpiryDate &&
        isNaN(new Date(row.warrantyExpiryDate).getTime())
      ) {
        rowErrors.push({
          errorCode: 'IMPORT_DEVICE_INVALID_WARRANTY_DATE',
          params: { rowNumber: String(rowNumber) },
        });
        continue;
      }

      const device = DeviceEntity.create(existingDevice?.id ?? "", {
        name: name,
        serialNumber,
        model: model ?? "",
        manufacturer: manufacturer ?? "",
        deviceTypeId: deviceTypeDoc._id,
        deviceStatusId: finalDeviceStatusId,
        supplierId: row.supplierId,
        purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : undefined,
        purchasePrice: row.purchasePrice
          ? Number(row.purchasePrice)
          : undefined,
        warrantyExpiryDate: row.warrantyExpiryDate
          ? new Date(row.warrantyExpiryDate)
          : undefined,
        notes: notes ?? "",
        isDeleted: false,
        currentAssignment: existingDevice?.currentAssignment ?? null,
        assignmentHistory: existingDevice?.assignmentHistory ?? [],
        maintenanceRecords: existingDevice?.maintenanceRecords ?? [],
        transactions: existingDevice?.transactions ?? [],
        createdBy: existingDevice?.createdBy ?? input.createdBy,
      });

      if (existingDevice) {
        devicesToUpdate.push(device);
      } else {
        devicesToInsert.push(device);
      }
    }

    if (rowErrors.length > 0) {
      const details = rowErrors
        .map((error) =>
          resolveApiErrorMessage(error.errorCode, error.params, locale),
        )
        .join('\n');

      throw new BadRequestException(
        buildLocalizedErrorPayload(
          'IMPORT_ROW_FAILED',
          { details },
          locale,
        ),
      );
    }

    let importedCount = 0;

    if (devicesToInsert.length > 0) {
      importedCount += await this.deviceRepository.bulkInsert(devicesToInsert);
    }

    let updatedCount = 0;
    if (devicesToUpdate.length > 0) {
      for (const device of devicesToUpdate) {
        await this.deviceRepository.save(device);
        updatedCount++;
      }
    }

    const skippedSerialNumbers = skippedItems
      .filter((item) => item.reason === "duplicate")
      .map((item) => item.serialNumber);

    return {
      importedCount,
      updatedCount,
      skippedCount: skippedItems.length,
      skippedSerialNumbers,
      skippedItems,
    };
  }

  private async parseCsv(buffer: Buffer): Promise<ImportDeviceRow[]> {
    const REQUIRED_HEADERS = [
      "deviceType",
      "serialNumber",
      "name",
      "model",
      "purchaseDate",
      "warrantyExpiryDate",
      "manufacturer",
      "purchasePrice",
      "notes",
      "deviceStatus",
    ];

    let rows: Record<string, string>[];

    try {
      rows = await parseCsvBuffer(buffer);
    } catch {
      throw new BadRequestException({
        errorCode: 'IMPORT_CSV_PARSE_ERROR',
        message: 'Error parsing CSV file',
      });
    }

    if (!rows.length) {
      throw new BadRequestException({
        errorCode: 'IMPORT_CSV_EMPTY',
        message: 'CSV file is empty',
      });
    }

    const actualHeaders = Object.keys(rows[0]).map((header) => header.trim());
    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !actualHeaders.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new BadRequestException({
        errorCode: 'IMPORT_CSV_MISSING_COLUMNS',
        params: { columns: missingHeaders.join(', ') },
        message: `Invalid CSV format. Missing headers: ${missingHeaders.join(", ")}`,
      });
    }

    return rows.map((row) => {
      const purchasePrice = getCsvValue(row, [
        "purchaseprice",
        "purchase_price",
      ]);

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
          "warranty_expiry_date",
        ]),
        notes: getCsvValue(row, ["notes"]),
      };
    });
  }
}
