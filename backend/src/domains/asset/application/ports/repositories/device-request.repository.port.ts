import { DeviceRequestEntity } from '@/domains/asset/domain/entities/device-request.entity';
import { PaginatedResult } from './device.repository.port';

export interface DeviceRequestFilterInput {
  search?: string;
  status?: string;
  type?: string;
  userId?: string;
  requestedByUserId?: string;
}

export interface DeviceRequestRepositoryPort {
  findById(id: string): Promise<DeviceRequestEntity | null>;
  findPaginated(filter: DeviceRequestFilterInput, page: number, limit: number): Promise<PaginatedResult<DeviceRequestEntity>>;
  save(request: DeviceRequestEntity): Promise<DeviceRequestEntity>;
}
