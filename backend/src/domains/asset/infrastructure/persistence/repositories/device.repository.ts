import { Injectable } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import _ from "lodash";
import {
  DeviceEntity,
  DeviceProps,
} from "@/domains/asset/domain/entities/device.entity";
import { DeviceAssignmentVo } from "@/domains/asset/domain/value-objects/device-assignment.vo";
import { DeviceMaintenanceVo } from "@/domains/asset/domain/value-objects/device-maintenance.vo";
import { DeviceTransactionVo } from "@/domains/asset/domain/value-objects/device-transaction.vo";
import {
  DeviceRepositoryPort,
  DeviceFilterInput,
  PaginatedResult,
  AssignedDevicesByDepartmentRow,
  ActiveAssignmentsByUserRow,
} from "@/domains/asset/application/ports/repositories/device.repository.port";

import { escapeRegex, sanitizeSearchKeyword } from "@/shared/utils/sanitize-search-keyword.util";
import { buildMongoObjectIdOrStringFieldMatch } from "@/shared/utils/mongo-object-id-field-match.util";

@Injectable()
export class DeviceRepository implements DeviceRepositoryPort {
  constructor(@InjectModel("Device") private readonly model: Model<any>) {}

  private applyDeviceRelationPopulates<T>(query: T): T {
    const chain = query as unknown as {
      populate: (path: string | Record<string, unknown>) => unknown;
    };

    chain.populate("deviceTypeId");
    chain.populate("deviceStatusId");
    chain.populate({
      path: "currentAssignment.userId",
      model: "InternalUser",
      select: "name",
    });

    return query;
  }

  private resolveAssignmentUserId(userIdField: unknown): string | undefined {
    if (!userIdField) {
      return undefined;
    }

    if (typeof userIdField === "object") {
      const record = userIdField as { _id?: { toString(): string }; id?: string };
      return record._id?.toString() ?? record.id;
    }

    return String(userIdField);
  }

  private resolveAssignmentUserName(
    userIdField: unknown,
    fallbackUserName?: string,
  ): string | undefined {
    if (
      typeof userIdField === "object" &&
      userIdField !== null &&
      "name" in userIdField &&
      typeof (userIdField as { name?: unknown }).name === "string"
    ) {
      return (userIdField as { name: string }).name;
    }

    return fallbackUserName;
  }

  private toEntity(doc: any): DeviceEntity {
    if (!doc) return null as any;

    const plain = doc.toJSON ? doc.toJSON() : doc;
    const id = plain.id || doc._id?.toString();

    const props: DeviceProps = {
      name: plain.name,
      serialNumber: plain.serialNumber,
      model: plain.model ?? "",
      manufacturer: plain.manufacturer ?? "",

      deviceTypeId:
        typeof plain.deviceTypeId === "object"
          ? plain.deviceTypeId?._id?.toString()
          : plain.deviceTypeId,

      deviceStatusId:
        typeof plain.deviceStatusId === "object"
          ? plain.deviceStatusId?._id?.toString()
          : plain.deviceStatusId,

      deviceType:
        plain.deviceTypeId && plain.deviceTypeId._id
          ? {
              id: plain.deviceTypeId._id.toString(),
              name: plain.deviceTypeId.name,
            }
          : undefined,

      status:
        plain.deviceStatusId && plain.deviceStatusId._id
          ? {
              id: plain.deviceStatusId._id.toString(),
              name: plain.deviceStatusId.name,
            }
          : undefined,
      supplierId: plain.supplierId
        ? typeof plain.supplierId === "object"
          ? plain.supplierId?._id?.toString()
          : plain.supplierId
        : undefined,

      purchaseDate: plain.purchaseDate ?? undefined,
      purchasePrice: plain.purchasePrice ?? undefined,
      warrantyExpiryDate: plain.warrantyExpiryDate ?? undefined,
      notes: plain.notes ?? "",
      isDeleted: plain.isDeleted ?? false,

      currentAssignment: plain.currentAssignment
        ? new DeviceAssignmentVo({
            userId:
              this.resolveAssignmentUserId(plain.currentAssignment.userId) ??
              "",
            userName:
              this.resolveAssignmentUserName(
                plain.currentAssignment.userId,
                plain.currentAssignment.userName,
              ) ?? "",
            assignedAt: plain.currentAssignment.assignedAt,
            assignedBy: plain.currentAssignment.assignedBy,
          })
        : null,

      assignmentHistory: _.map(plain.assignmentHistory ?? [], (item) => ({
        userId:
          typeof item.userId === "object"
            ? item.userId?.toString()
            : item.userId,
        userName: item.userName,
        assignedAt: item.assignedAt,
        returnedAt: item.returnedAt ?? null,
        assignedBy: item.assignedBy,
        returnedBy: item.returnedBy ?? null,
      })),

      maintenanceRecords: _.map(
        plain.maintenanceRecords ?? [],
        (r) =>
          new DeviceMaintenanceVo({
            maintenanceType: r.maintenanceType,
            status: r.status,
            scheduledDate: r.scheduledDate,
            cost: r.cost ?? undefined,
            description: r.description,
          }),
      ),
      
      transactions: _.map(
        plain.transactions ?? [],
        (t) =>
          new DeviceTransactionVo({
            transactionType: t.transactionType,
            userId: t.userId
              ? typeof t.userId === "object"
                ? t.userId?.toString()
                : t.userId
              : undefined,
            performedBy: t.performedBy,
            notes: t.notes,
            metadata: t.metadata,
            date: t.date,
          }),
      ),
      createdBy: plain.createdBy,
      updatedBy: plain.updatedBy,
    };

    return DeviceEntity.create(id, props);
  }

  async findById(id: string): Promise<DeviceEntity | null> {
    const doc = await this.applyDeviceRelationPopulates(this.model.findById(id))
      .lean()
      .exec();
    return this.toEntity(doc);
  }

  async findAll(filter: DeviceFilterInput): Promise<DeviceEntity[]> {
    const query = this.buildFilterQuery(filter);
    const docs = await this.applyDeviceRelationPopulates(this.model.find(query))
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async findPaginated(
    filter: DeviceFilterInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<DeviceEntity>> {
    const query = this.buildFilterQuery(filter);
    const sort = this.buildSort(filter.sort, filter.order);
    const [docs, total] = await Promise.all([
      this.applyDeviceRelationPopulates(this.model.find(query))
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items: _.map(docs, (doc) => this.toEntity(doc)),
      total,
      page,
      limit,
    };
  }

  async findBySerialNumber(
    serialNumber: string,
  ): Promise<DeviceEntity | null> {
    const doc = await this.applyDeviceRelationPopulates(
      this.model.findOne({
        serialNumber: serialNumber.toUpperCase(),
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      }),
    )
      .lean()
      .exec();

    return doc ? this.toEntity(doc) : null;
  }

  async save(device: DeviceEntity): Promise<DeviceEntity> {
    const plain = device.toPlainObject();

    const data: any = _.omit(plain, "id");

    // convert root object ids
    if (data.deviceTypeId) {
      data.deviceTypeId = new Types.ObjectId(data.deviceTypeId as string);
    }

    if (data.deviceStatusId) {
      data.deviceStatusId = new Types.ObjectId(data.deviceStatusId as string);
    }

    if (data.supplierId) {
      data.supplierId = new Types.ObjectId(data.supplierId as string);
    }

    // current assignment
    if (data.currentAssignment) {
      data.currentAssignment = {
        ...data.currentAssignment,
        userId: data.currentAssignment.userId
          ? new Types.ObjectId(data.currentAssignment.userId as string)
          : null,
      };
    } else {
      data.currentAssignment = null;
    }

    // assignment history
    if (Array.isArray(data.assignmentHistory)) {
      data.assignmentHistory = data.assignmentHistory.map((item: any) => ({
        ...item,
        userId: item.userId
          ? new Types.ObjectId(item.userId)
          : null,
      }));
    }

    // transactions
    if (Array.isArray(data.transactions)) {
      data.transactions = data.transactions.map((item: any) => ({
        ...item,
        userId: item.userId
          ? new Types.ObjectId(item.userId)
          : null,
      }));
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(device.id);

    if (isObjectId) {
      const doc = await this.model
        .findOneAndUpdate(
          { _id: device.id },
          data,
          {
            upsert: true,
            new: true,
          },
        )
        .exec();

      return this.toEntity(doc);
    }

    const doc = await this.model.create(data);

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async existsBySerialNumber(serialNumber: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({
        serialNumber: serialNumber.toUpperCase(),
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      })
      .exec();
    return count > 0;
  }

  async existsBySerialNumberExcludeId(
    serialNumber: string,
    excludeId: string,
  ): Promise<boolean> {
    const count = await this.model.countDocuments({
      _id: { $ne: new Types.ObjectId(excludeId) },
      serialNumber: serialNumber.toUpperCase(),
    });

    return count > 0;
  }

  async bulkInsert(devices: DeviceEntity[]): Promise<number> {
    if (_.isEmpty(devices)) return 0;

    const docs = _.map(devices, (device) => {
      const plain = device.toPlainObject();
      return _.omit(plain, "id");
    });

    const result = await this.model.insertMany(docs);
    return result.length;
  }

  async findForExport(filter: DeviceFilterInput): Promise<DeviceEntity[]> {
    const query = this.buildFilterQuery(filter);
    const docs = await this.applyDeviceRelationPopulates(this.model.find(query))
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return _.map(docs, (doc) => this.toEntity(doc));
  }

  async aggregateAssignedDevicesByDepartment(): Promise<AssignedDevicesByDepartmentRow[]> {
    const internalUserModel = this.model.db.models["InternalUser"];
    const deviceTypeModel = this.model.db.models["DeviceType"];

    if (!internalUserModel || !deviceTypeModel) {
      return [];
    }

    const usersCollection = internalUserModel.collection.name;
    const typesCollection = deviceTypeModel.collection.name;

    const rows = await this.model.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          "currentAssignment.userId": { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: usersCollection,
          let: { assignedUserId: "$currentAssignment.userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$assignedUserId"] },
                    {
                      $eq: [
                        { $toString: "$_id" },
                        { $toString: "$$assignedUserId" },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "assignedUser",
        },
      },
      { $unwind: "$assignedUser" },
      {
        $match: {
          "assignedUser.isDeleted": { $ne: true },
          "assignedUser.departmentId": { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: typesCollection,
          localField: "deviceTypeId",
          foreignField: "_id",
          as: "deviceType",
        },
      },
      {
        $unwind: { path: "$deviceType", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: {
            departmentId: "$assignedUser.departmentId",
            deviceTypeName: { $ifNull: ["$deviceType.name", "Other"] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          departmentId: { $toString: "$_id.departmentId" },
          deviceTypeName: "$_id.deviceTypeName",
          count: 1,
        },
      },
    ]);

    return rows.map((row) => ({
      departmentId:
        typeof row.departmentId === "object" && row.departmentId?.toString
          ? row.departmentId.toString()
          : String(row.departmentId ?? ""),
      deviceTypeName: String(row.deviceTypeName ?? "Other"),
      count: Number(row.count ?? 0),
    }));
  }

  async aggregateActiveAssignmentsByUserIds(
    userIds?: string[],
  ): Promise<ActiveAssignmentsByUserRow[]> {
    const match: Record<string, unknown> = {
      isDeleted: { $ne: true },
      "currentAssignment.userId": { $exists: true, $ne: null },
    };

    if (userIds && userIds.length > 0) {
      const objectIds = userIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      match.$or = [
        { "currentAssignment.userId": { $in: objectIds } },
        { "currentAssignment.userId": { $in: userIds } },
      ];
    }

    const rows = await this.model
      .aggregate<{ _id: unknown; count: number }>([
        { $match: match },
        {
          $group: {
            _id: "$currentAssignment.userId",
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    return rows.map((row) => ({
      userId:
        typeof row._id === "object" && row._id !== null && "toString" in row._id
          ? (row._id as { toString(): string }).toString()
          : String(row._id ?? ""),
      count: Number(row.count ?? 0),
    }));
  }

  async aggregateCountByStatus(): Promise<Record<string, number>> {
    const deviceStatusModel = this.model.db.models["DeviceStatus"];
    if (!deviceStatusModel) {
      return {};
    }

    const statusesCollection = deviceStatusModel.collection.name;

    const rows = await this.model.aggregate([
      {
        $match: {
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        },
      },
      {
        $group: {
          _id: "$deviceStatusId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: statusesCollection,
          localField: "_id",
          foreignField: "_id",
          as: "status",
        },
      },
      {
        $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          statusName: { $ifNull: ["$status.name", "unknown"] },
          count: 1,
        },
      },
    ]);

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[String(row.statusName ?? "unknown")] = Number(row.count ?? 0);
    }
    return result;
  }

  private buildSort(
    sortField?: string,
    order?: "asc" | "desc",
  ): Record<string, 1 | -1> {
    const allowed: Record<string, string> = {
      serialNumber: "serialNumber",
      name: "name",
      deviceTypeId: "deviceTypeId",
      purchaseDate: "purchaseDate",
      warrantyExpiryDate: "warrantyExpiryDate",
      createdAt: "createdAt",
    };
    const field = allowed[sortField ?? ""] ?? "createdAt";
    const direction: 1 | -1 = order === "asc" ? 1 : -1;
    return { [field]: direction };
  }

  private buildFilterQuery(filter: DeviceFilterInput): Record<string, unknown> {
    const query: Record<string, unknown>[] = [];
    const search = sanitizeSearchKeyword(filter.search);
    if (!_.isNil(search)) {
      const escaped = escapeRegex(search);
      query.push({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { serialNumber: { $regex: escaped, $options: "i" } },
          { model: { $regex: escaped, $options: "i" } },
          { manufacturer: { $regex: escaped, $options: "i" } },
        ],
      });
    }

    if (!_.isNil(filter.deviceTypeId)) {
      query.push({
        deviceTypeId: new Types.ObjectId(filter.deviceTypeId),
      });
    }

    if (!_.isNil(filter.deviceStatusId)) {
      query.push({
        deviceStatusId: new Types.ObjectId(filter.deviceStatusId),
      });
    }

    if (!_.isNil(filter.supplierId)) {
      query.push({
        supplierId: new Types.ObjectId(filter.supplierId),
      });
    }

    if (!_.isNil(filter.isDeleted)) {
      query.push({ isDeleted: filter.isDeleted });
    }

    if (!_.isNil(filter.assignedUserId)) {
      if (filter.assignedUserId === "any") {
        query.push({
          "currentAssignment.userId": { $exists: true, $ne: null },
        });
      } else {
        query.push(
          buildMongoObjectIdOrStringFieldMatch(
            "currentAssignment.userId",
            filter.assignedUserId,
          ),
        );
      }
    }

    return query.length > 0 ? { $and: query } : {};
  }
}
