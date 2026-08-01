import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Department,
  DepartmentSchema,
  Position,
  PositionSchema,
  InternalUser,
  InternalUserSchema,
  Supplier,
  SupplierSchema,
} from './schemas';
import {
  DepartmentRepository,
  PositionRepository,
  InternalUserRepository,
  SupplierRepository,
} from './repositories';
import { IdentityMongooseModule } from '@/domains/identity/infrastructure/persistence/mongoose.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: InternalUser.name, schema: InternalUserSchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    forwardRef(() => IdentityMongooseModule),
  ],
  providers: [
    { provide: 'DepartmentRepositoryPort', useClass: DepartmentRepository },
    { provide: 'PositionRepositoryPort', useClass: PositionRepository },
    { provide: 'InternalUserRepositoryPort', useClass: InternalUserRepository },
    { provide: 'SupplierRepositoryPort', useClass: SupplierRepository },
  ],
  exports: [
    'DepartmentRepositoryPort',
    'PositionRepositoryPort',
    'InternalUserRepositoryPort',
    'SupplierRepositoryPort',
    MongooseModule,
  ],
})
export class OrganizationMongooseModule {}
