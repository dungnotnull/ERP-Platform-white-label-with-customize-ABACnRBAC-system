import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { TransactionTypeEnum } from '@/shared/domain/enums/device.enum';
import { DeviceAssignmentVo, AssignmentHistoryItemProps } from '../value-objects/device-assignment.vo';
import { DeviceMaintenanceVo } from '../value-objects/device-maintenance.vo';
import { DeviceTransactionVo } from '../value-objects/device-transaction.vo';
import { DeviceAssignedEvent } from '../events/device-assigned.event';
import { DeviceReturnedEvent } from '../events/device-returned.event';

export interface DeviceProps {
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  deviceTypeId: string;
  deviceStatusId: string;
  deviceType?: any;
  status?: any;
  supplierId?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiryDate?: Date;
  notes: string;
  isDeleted: boolean;
  currentAssignment: DeviceAssignmentVo | null;
  assignmentHistory: AssignmentHistoryItemProps[];
  maintenanceRecords: DeviceMaintenanceVo[];
  transactions: DeviceTransactionVo[];
  createdBy?: string;
  updatedBy?: string;
}

export class DeviceEntity extends AggregateRoot<DeviceProps> {
  get name(): string {
    return this.props.name;
  }

  get serialNumber(): string {
    return this.props.serialNumber;
  }

  get model(): string {
    return this.props.model;
  }

  get manufacturer(): string {
    return this.props.manufacturer;
  }

  get deviceTypeId(): string {
    return this.props.deviceTypeId;
  }

  get deviceStatusId(): string {
    return this.props.deviceStatusId;
  }

  get deviceType(): any {
    return this.props.deviceType;
  }

  get status(): any {
    return this.props.status;
  }

  get supplierId(): string | undefined {
    return this.props.supplierId;
  }

  get purchaseDate(): Date | undefined {
    return this.props.purchaseDate;
  }

  get purchasePrice(): number | undefined {
    return this.props.purchasePrice;
  }

  get warrantyExpiryDate(): Date | undefined {
    return this.props.warrantyExpiryDate;
  }

  get notes(): string {
    return this.props.notes;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get currentAssignment(): DeviceAssignmentVo | null {
    return this.props.currentAssignment;
  }

  get assignmentHistory(): AssignmentHistoryItemProps[] {
    return this.props.assignmentHistory;
  }

  get maintenanceRecords(): DeviceMaintenanceVo[] {
    return this.props.maintenanceRecords;
  }

  get transactions(): DeviceTransactionVo[] {
    return this.props.transactions;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  private constructor(id: string, props: DeviceProps) {
    super(id, props);
  }

  public assignTo(userId: string, userName: string, assignedBy: string): void {
    if (this.props.currentAssignment !== null) {
      throw new Error(`Device "${this._id}" is already assigned`);
    }

    const now = new Date();

    const assignment: AssignmentHistoryItemProps = {
      userId,
      userName,
      assignedAt: now,
      returnedAt: null,
      assignedBy,
      returnedBy: null,
    };

    // current assignment
    this.props.currentAssignment = new DeviceAssignmentVo({
      userId,
      userName,
      assignedAt: now,
      assignedBy,
    });

    // history
    this.props.assignmentHistory = [
      ...this.props.assignmentHistory,
      assignment,
    ];

    // transaction log
    this.props.transactions = [
      ...this.props.transactions,
      new DeviceTransactionVo({
        transactionType: TransactionTypeEnum.ASSIGNMENT,
        userId,
        performedBy: assignedBy,
        notes: `Assigned to ${userName}`,
        date: now,
      }),
    ];

    this.addDomainEvent(
      new DeviceAssignedEvent({
        deviceId: this._id,
        userId,
        assignedBy,
      }),
    );
  }

  public returnDevice(returnedBy: string, notes?: string): void {
    if (this.props.currentAssignment === null) {
      throw new Error(`Device "${this._id}" is not currently assigned`);
    }

    const assignment = this.props.currentAssignment;
    const now = new Date();

    const lastAssignment =
      this.props.assignmentHistory[
        this.props.assignmentHistory.length - 1
      ];

    if (!lastAssignment || lastAssignment.returnedAt) {
      throw new Error('No active assignment found');
    }

    // update existing history item
    lastAssignment.returnedAt = now;
    lastAssignment.returnedBy = returnedBy;

    // clear current assignment
    this.props.currentAssignment = null;

    // transaction
    this.props.transactions = [
      ...this.props.transactions,
      new DeviceTransactionVo({
        transactionType: TransactionTypeEnum.RETURN,
        userId: assignment.userId,
        performedBy: returnedBy,
        notes: `Returned from ${assignment.userName}`,
        date: now,
      }),
    ];

    this.addDomainEvent(
      new DeviceReturnedEvent({
        deviceId: this._id,
        returnedBy,
      }),
    );
  }

  public addMaintenance(record: DeviceMaintenanceVo): void {
    this.props.maintenanceRecords = [...this.props.maintenanceRecords, record];

    this.props.transactions = [
      ...this.props.transactions,
      new DeviceTransactionVo({
        transactionType: TransactionTypeEnum.MAINTENANCE,
        notes: `Maintenance: ${record.maintenanceType}`,
        date: new Date(),
      }),
    ];
  }

  public updateMaintenanceRecord(index: number, updated: DeviceMaintenanceVo): void {
    if (index < 0 || index >= this.props.maintenanceRecords.length) {
      throw new Error(`Maintenance record at index ${index} not found`);
    }

    const records = [...this.props.maintenanceRecords];
    records[index] = updated;
    this.props.maintenanceRecords = records;
  }

  public addTransaction(record: DeviceTransactionVo): void {
    this.props.transactions = [...this.props.transactions, record];
  }

  public markAsDeleted(): void {
    this.props.isDeleted = true;

    this.props.transactions = [
      ...this.props.transactions,
      new DeviceTransactionVo({
        transactionType: TransactionTypeEnum.DISPOSAL,
        notes: 'Device marked as deleted',
        date: new Date(),
      }),
    ];
  }

  public updateFields(fields: Partial<Omit<DeviceProps, 'isDeleted' | 'currentAssignment' | 'assignmentHistory' | 'maintenanceRecords' | 'transactions'>>): void {
    const allowedFields = [
      'name', 'serialNumber', 'model', 'manufacturer', 'deviceTypeId', 'deviceStatusId',
      'supplierId', 'purchaseDate', 'purchasePrice', 'warrantyExpiryDate',
      'notes', 'updatedBy',
    ] as const;

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        (this.props as unknown as Record<string, unknown>)[field] = fields[field];
      }
    }
  }

  public updateStatus(newStatusId: string, oldStatusId: string, performedBy?: string): void {
    this.props.deviceStatusId = newStatusId;

    this.props.transactions = [
      ...this.props.transactions,
      new DeviceTransactionVo({
        transactionType: TransactionTypeEnum.STATUS_CHANGE,
        performedBy,
        notes: `Status changed from ${oldStatusId} to ${newStatusId}`,
        metadata: { oldStatusId, newStatusId },
        date: new Date(),
      }),
    ];
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this.props.name,
      serialNumber: this.props.serialNumber,
      model: this.props.model,
      manufacturer: this.props.manufacturer,
      deviceTypeId: this.props.deviceTypeId,
      deviceStatusId: this.props.deviceStatusId,
      deviceType: this.props.deviceType,
      status: this.props.status,
      supplierId: this.props.supplierId,
      purchaseDate: this.props.purchaseDate,
      purchasePrice: this.props.purchasePrice,
      warrantyExpiryDate: this.props.warrantyExpiryDate,
      notes: this.props.notes,
      isDeleted: this.props.isDeleted,
      currentAssignment: this.props.currentAssignment?.toPlainObject() ?? null,
      assignmentHistory: this.props.assignmentHistory,
      maintenanceRecords: this.props.maintenanceRecords.map((r) => r.toPlainObject()),
      transactions: this.props.transactions.map((t) => t.toPlainObject()),
      createdBy: this.props.createdBy,
      updatedBy: this.props.updatedBy,
    };
  }

  public static create(id: string, props: DeviceProps): DeviceEntity {
    return new DeviceEntity(id, props);
  }
}
