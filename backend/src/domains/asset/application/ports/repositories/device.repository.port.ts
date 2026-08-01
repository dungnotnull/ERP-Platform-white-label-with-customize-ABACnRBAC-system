import { DeviceEntity } from '@/domains/asset/domain/entities/device.entity';

export interface DeviceFilterInput {
  search?: string;
  deviceTypeId?: string;
  deviceStatusId?: string;
  supplierId?: string;
  isDeleted?: boolean;
  assignedUserId?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AssignedDevicesByDepartmentRow {
  departmentId: string;
  deviceTypeName: string;
  count: number;
}

export interface ActiveAssignmentsByUserRow {
  userId: string;
  count: number;
}

export interface DeviceRepositoryPort {
  findById(id: string): Promise<DeviceEntity | null>;
  findAll(filter: DeviceFilterInput): Promise<DeviceEntity[]>;
  findPaginated(filter: DeviceFilterInput, page: number, limit: number): Promise<PaginatedResult<DeviceEntity>>;
  findBySerialNumber(serialNumber: string, ): Promise<DeviceEntity | null>;
  save(device: DeviceEntity): Promise<DeviceEntity>;
  delete(id: string): Promise<void>;
  existsBySerialNumber(serialNumber: string): Promise<boolean>;
  existsBySerialNumberExcludeId(serialNumber: string, excludeId: string,): Promise<boolean>;
  bulkInsert(devices: DeviceEntity[]): Promise<number>;
  findForExport(filter: DeviceFilterInput): Promise<DeviceEntity[]>;
  aggregateAssignedDevicesByDepartment(): Promise<AssignedDevicesByDepartmentRow[]>;
  aggregateActiveAssignmentsByUserIds(
    userIds?: string[],
  ): Promise<ActiveAssignmentsByUserRow[]>;
  aggregateCountByStatus(): Promise<Record<string, number>>;
}
