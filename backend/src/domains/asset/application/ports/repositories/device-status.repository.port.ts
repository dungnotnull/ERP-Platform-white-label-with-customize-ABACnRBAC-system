import { DeviceStatusEntity } from '@/domains/asset/domain/entities/device-status.entity';

export interface DeviceStatusRepositoryPort {
  findById(id: string): Promise<DeviceStatusEntity | null>;
  findByName(name: string): Promise<DeviceStatusEntity | null>;
  findAll(): Promise<DeviceStatusEntity[]>;
  save(deviceStatus: DeviceStatusEntity): Promise<DeviceStatusEntity>;
}
