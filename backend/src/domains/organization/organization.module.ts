import { Module, forwardRef } from '@nestjs/common';
import { OrganizationMongooseModule } from './infrastructure/persistence/mongoose.module';
import { AssetModule } from '../asset/asset.module';
import { AssignmentQueryAdapter } from '../asset/infrastructure/adapters/assignment-query.adapter';
import { DeviceCreationAdapter } from '../asset/infrastructure/adapters/device-creation.adapter';

import { CreateDepartmentUseCase } from './application/use-cases/department/create-department.use-case';
import { UpdateDepartmentUseCase } from './application/use-cases/department/update-department.use-case';
import { DeleteDepartmentUseCase } from './application/use-cases/department/delete-department.use-case';
import { GetDepartmentsUseCase } from './application/use-cases/department/get-departments.use-case';
import { GetDepartmentsOverviewUseCase } from './application/use-cases/department/get-departments-overview.use-case';
import { GetDevicesByDepartmentUseCase } from './application/use-cases/department/get-devices-by-department.use-case';
import { ImportDepartmentsUseCase } from './application/use-cases/department/import-departments.use-case';
import { ExportDepartmentsUseCase } from './application/use-cases/department/export-departments.use-case';
import { CreatePositionUseCase } from './application/use-cases/position/create-position.use-case';
import { UpdatePositionUseCase } from './application/use-cases/position/update-position.use-case';
import { DeletePositionUseCase } from './application/use-cases/position/delete-position.use-case';
import { GetPositionsUseCase } from './application/use-cases/position/get-positions.use-case';
import { ImportPositionsUseCase } from './application/use-cases/position/import-positions.use-case';
import { ExportPositionsUseCase } from './application/use-cases/position/export-positions.use-case';
import { CreateInternalUserUseCase } from './application/use-cases/internal-user/create-internal-user.use-case';
import { UpdateInternalUserUseCase } from './application/use-cases/internal-user/update-internal-user.use-case';
import { DeleteInternalUserUseCase } from './application/use-cases/internal-user/delete-internal-user.use-case';
import { GetInternalUserUseCase } from './application/use-cases/internal-user/get-internal-user.use-case';
import { GetInternalUsersUseCase } from './application/use-cases/internal-user/get-internal-users.use-case';
import { GetDeviceSummaryUseCase } from './application/use-cases/internal-user/get-device-summary.use-case';
import { GetUserDeviceSummaryListUseCase } from './application/use-cases/internal-user/get-user-device-summary-list.use-case';
import { GetEmployeeDeviceSummaryReportUseCase } from './application/use-cases/internal-user/get-employee-device-summary-report.use-case';
import { ImportInternalUsersUseCase } from './application/use-cases/internal-user/import-internal-users.use-case';
import { ExportInternalUsersUseCase } from './application/use-cases/internal-user/export-internal-users.use-case';
import { ReconcileInternalUserDeviceSummariesUseCase } from './application/use-cases/internal-user/reconcile-internal-user-device-summaries.use-case';
import { InternalUserUniquenessService } from './application/services/internal-user-uniqueness.service';
import { CreateSupplierUseCase } from './application/use-cases/supplier/create-supplier.use-case';
import { UpdateSupplierUseCase } from './application/use-cases/supplier/update-supplier.use-case';
import { GetSuppliersUseCase } from './application/use-cases/supplier/get-suppliers.use-case';
import { GetSupplierUseCase } from './application/use-cases/supplier/get-supplier.use-case';
import { CreatePurchaseOrderUseCase } from './application/use-cases/purchase-order/create-purchase-order.use-case';
import { UpdatePurchaseOrderUseCase } from './application/use-cases/purchase-order/update-purchase-order.use-case';
import { ApprovePurchaseOrderUseCase } from './application/use-cases/purchase-order/approve-purchase-order.use-case';
import { GetPurchaseOrdersUseCase } from './application/use-cases/purchase-order/get-purchase-orders.use-case';

import { DepartmentController } from './presentation/controllers/department.controller';
import { PositionController } from './presentation/controllers/position.controller';
import { InternalUserController } from './presentation/controllers/internal-user.controller';
import { SupplierController } from './presentation/controllers/supplier.controller';
import { PurchaseOrderController } from './presentation/controllers/purchase-order.controller';

import { InternalUserRepository } from './infrastructure/persistence/repositories';
import { DeleteSupplierUseCase } from './application/use-cases/supplier/delete-supplier.use-case';
import { InternalUserDeviceSummarySyncAdapter } from './infrastructure/adapters/internal-user-device-summary-sync.adapter';
import { DepartmentQueryAdapter } from './infrastructure/adapters/department-query.adapter';
import { InternalUserQueryAdapter } from './infrastructure/adapters/internal-user-query.adapter';

const useCases = [
  CreateDepartmentUseCase,
  UpdateDepartmentUseCase,
  DeleteDepartmentUseCase,
  GetDepartmentsUseCase,
  GetDepartmentsOverviewUseCase,
  GetDevicesByDepartmentUseCase,
  ImportDepartmentsUseCase,
  ExportDepartmentsUseCase,
  CreatePositionUseCase,
  UpdatePositionUseCase,
  DeletePositionUseCase,
  GetPositionsUseCase,
  ImportPositionsUseCase,
  ExportPositionsUseCase,
  CreateInternalUserUseCase,
  UpdateInternalUserUseCase,
  DeleteInternalUserUseCase,
  GetInternalUserUseCase,
  GetInternalUsersUseCase,
  GetDeviceSummaryUseCase,
  GetUserDeviceSummaryListUseCase,
  GetEmployeeDeviceSummaryReportUseCase,
  ImportInternalUsersUseCase,
  ExportInternalUsersUseCase,
  ReconcileInternalUserDeviceSummariesUseCase,
  CreateSupplierUseCase,
  UpdateSupplierUseCase,
  GetSuppliersUseCase,
  GetSupplierUseCase,
  DeleteSupplierUseCase,
  CreatePurchaseOrderUseCase,
  UpdatePurchaseOrderUseCase,
  ApprovePurchaseOrderUseCase,
  GetPurchaseOrdersUseCase,
];

@Module({
  imports: [OrganizationMongooseModule, forwardRef(() => AssetModule)],
  controllers: [
    DepartmentController,
    PositionController,
    InternalUserController,
    SupplierController,
    PurchaseOrderController,
  ],
  providers: [
    ...useCases,
    InternalUserRepository,
    InternalUserUniquenessService,
    InternalUserDeviceSummarySyncAdapter,
    DepartmentQueryAdapter,
    InternalUserQueryAdapter,

    {
      provide: 'InternalUserRepositoryPort',
      useExisting: InternalUserRepository,
    },

    {
      provide: 'AssignmentQueryPort',
      useExisting: AssignmentQueryAdapter,
    },
    {
      provide: 'InternalUserDeviceSummarySyncPort',
      useExisting: InternalUserDeviceSummarySyncAdapter,
    },
    {
      provide: 'DeviceCreationPort',
      useExisting: DeviceCreationAdapter,
    },
    {
      provide: 'DepartmentQueryPort',
      useExisting: DepartmentQueryAdapter,
    },
    {
      provide: 'InternalUserQueryPort',
      useExisting: InternalUserQueryAdapter,
    },
    {
      provide: 'INTERNAL_USER_QUERY_PORT',
      useExisting: InternalUserQueryAdapter,
    },
  ],
  exports: [
    ...useCases,
    InternalUserRepository,
    'InternalUserRepositoryPort',
    'InternalUserDeviceSummarySyncPort',
    'DepartmentQueryPort',
    'InternalUserQueryPort',
    'INTERNAL_USER_QUERY_PORT',
  ],
})
export class OrganizationModule {}
