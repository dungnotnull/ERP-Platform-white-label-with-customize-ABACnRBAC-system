import { Module, forwardRef } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { AssetMongooseModule } from './infrastructure/persistence/mongoose.module';
import { IdentityModule } from '../identity/identity.module';
import { UserCheckingAdapter } from '../identity/infrastructure/adapters/user-checking.adapter';
import { UserCheckingPort } from './application/ports/services/user-checking.port';
import { InternalUserCheckingAdapter } from '../identity/infrastructure/adapters/InternalUserCheckingAdapter';
import { InternalUserCheckingPort } from './application/ports/services/internal-user-checking.port';

import { CreateDeviceUseCase } from './application/use-cases/device/create-device.use-case';
import { UpdateDeviceUseCase } from './application/use-cases/device/update-device.use-case';
import { UpdateDeviceStatusUseCase as UpdateDeviceEntityStatusUseCase } from './application/use-cases/device/update-device-status.use-case';
import { DeleteDeviceUseCase } from './application/use-cases/device/delete-device.use-case';
import { GetDeviceUseCase } from './application/use-cases/device/get-device.use-case';
import { GetDevicesUseCase } from './application/use-cases/device/get-devices.use-case';
import { GetDeviceStatisticsUseCase } from './application/use-cases/device/get-device-statistics.use-case';
import { ImportDevicesUseCase } from './application/use-cases/device/import-devices.use-case';
import { ExportDevicesUseCase } from './application/use-cases/device/export-devices.use-case';
import { AssignDeviceUseCase } from './application/use-cases/assignment/assign-device.use-case';
import { ReturnDeviceUseCase } from './application/use-cases/assignment/return-device.use-case';
import { GetAssignmentsUseCase } from './application/use-cases/assignment/get-assignments.use-case';
import { CreateMaintenanceUseCase } from './application/use-cases/maintenance/create-maintenance.use-case';
import { UpdateMaintenanceUseCase } from './application/use-cases/maintenance/update-maintenance.use-case';
import { GetMaintenanceUseCase } from './application/use-cases/maintenance/get-maintenance.use-case';
import { CreateDeviceRequestUseCase } from './application/use-cases/request/create-device-request.use-case';
import { UpdateDeviceRequestUseCase } from './application/use-cases/request/update-device-request.use-case';
import { ApproveDeviceRequestUseCase } from './application/use-cases/request/approve-device-request.use-case';
import { RejectDeviceRequestUseCase } from './application/use-cases/request/reject-device-request.use-case';
import { CompleteDeviceRequestUseCase } from './application/use-cases/request/complete-device-request.use-case';
import { CancelDeviceRequestUseCase } from './application/use-cases/request/cancel-device-request.use-case';
import { GetDeviceRequestsUseCase } from './application/use-cases/request/get-device-requests.use-case';
import { CreateDeviceTypeUseCase } from './application/use-cases/device-type/create-device-type.use-case';
import { UpdateDeviceTypeUseCase } from './application/use-cases/device-type/update-device-type.use-case';
import { GetDeviceTypesUseCase } from './application/use-cases/device-type/get-device-types.use-case';
import { CreateDeviceStatusUseCase } from './application/use-cases/device-status/create-device-status.use-case';
import { UpdateDeviceStatusUseCase } from './application/use-cases/device-status/update-device-status.use-case';
import { GetDeviceStatusesUseCase } from './application/use-cases/device-status/get-device-statuses.use-case';

import { AssignmentQueryAdapter } from './infrastructure/adapters/assignment-query.adapter';
import { DeviceCreationAdapter } from './infrastructure/adapters/device-creation.adapter';

import { DeviceController } from './presentation/controllers/device.controller';
import { DeviceAssignmentController } from './presentation/controllers/device-assignment.controller';
import { DeviceMaintenanceController } from './presentation/controllers/device-maintenance.controller';
import { DeviceRequestController } from './presentation/controllers/device-request.controller';
import { DeviceTypeController } from './presentation/controllers/device-type.controller';
import { DeviceStatusController } from './presentation/controllers/device-status.controller';

const useCases = [
  CreateDeviceUseCase,
  UpdateDeviceUseCase,
  UpdateDeviceEntityStatusUseCase,
  DeleteDeviceUseCase,
  GetDeviceUseCase,
  GetDevicesUseCase,
  GetDeviceStatisticsUseCase,
  ImportDevicesUseCase,
  ExportDevicesUseCase,
  AssignDeviceUseCase,
  ReturnDeviceUseCase,
  GetAssignmentsUseCase,
  CreateMaintenanceUseCase,
  UpdateMaintenanceUseCase,
  GetMaintenanceUseCase,
  CreateDeviceRequestUseCase,
  UpdateDeviceRequestUseCase,
  ApproveDeviceRequestUseCase,
  RejectDeviceRequestUseCase,
  CompleteDeviceRequestUseCase,
  CancelDeviceRequestUseCase,
  GetDeviceRequestsUseCase,
  CreateDeviceTypeUseCase,
  UpdateDeviceTypeUseCase,
  GetDeviceTypesUseCase,
  CreateDeviceStatusUseCase,
  UpdateDeviceStatusUseCase,
  GetDeviceStatusesUseCase,
];

@Module({
  imports: [AssetMongooseModule, forwardRef(() => IdentityModule), forwardRef(() => OrganizationModule)],
  controllers: [
    DeviceController,
    DeviceAssignmentController,
    DeviceMaintenanceController,
    DeviceRequestController,
    DeviceTypeController,
    DeviceStatusController,
  ],
  providers: [
    ...useCases,
    AssignmentQueryAdapter,
    DeviceCreationAdapter,
    {
      provide: 'UserCheckingPort',
      useExisting: UserCheckingAdapter,
    },
    {
      provide: 'InternalUserCheckingPort',
      useExisting: InternalUserCheckingAdapter,
    },
  ],
  exports: [
    ...useCases,
    AssignmentQueryAdapter,
    DeviceCreationAdapter,
    AssetMongooseModule,
  ],
})
export class AssetModule {}
