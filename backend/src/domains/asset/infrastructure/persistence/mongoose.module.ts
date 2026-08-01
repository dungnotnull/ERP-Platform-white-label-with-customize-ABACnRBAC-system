import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Device,
  DeviceSchema,
  DeviceType,
  DeviceTypeSchema,
  DeviceStatus,
  DeviceStatusSchema,
  DeviceRequest,
  DeviceRequestSchema,
} from './schemas';
import {
  DeviceRepository,
  DeviceTypeRepository,
  DeviceStatusRepository,
  DeviceRequestRepository,
} from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: DeviceType.name, schema: DeviceTypeSchema },
      { name: DeviceStatus.name, schema: DeviceStatusSchema },
      { name: DeviceRequest.name, schema: DeviceRequestSchema },
    ]),
  ],
  providers: [
    { provide: 'DeviceRepositoryPort', useClass: DeviceRepository },
    { provide: 'DeviceTypeRepositoryPort', useClass: DeviceTypeRepository },
    { provide: 'DeviceStatusRepositoryPort', useClass: DeviceStatusRepository },
    { provide: 'DeviceRequestRepositoryPort', useClass: DeviceRequestRepository },
  ],
  exports: [
    MongooseModule,
    'DeviceRepositoryPort',
    'DeviceTypeRepositoryPort',
    'DeviceStatusRepositoryPort',
    'DeviceRequestRepositoryPort',
  ],
})
export class AssetMongooseModule {}
