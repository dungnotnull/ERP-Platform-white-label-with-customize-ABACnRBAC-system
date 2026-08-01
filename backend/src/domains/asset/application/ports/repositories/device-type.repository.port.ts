import { DeviceTypeEntity } from '@/domains/asset/domain/entities/device-type.entity';

export interface DeviceTypeRepositoryPort {
  findById(id: string): Promise<DeviceTypeEntity | null>;
  findByName(name: string): Promise<DeviceTypeEntity | null>;
  findAll(): Promise<DeviceTypeEntity[]>;
  save(deviceType: DeviceTypeEntity): Promise<DeviceTypeEntity>;
}
