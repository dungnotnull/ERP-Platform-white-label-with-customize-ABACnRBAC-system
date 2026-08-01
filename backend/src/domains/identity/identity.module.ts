import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@/config/config.service';
import { IdentityMongooseModule } from './infrastructure/persistence/mongoose.module';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher';
import { JwtTokenGenerator } from './infrastructure/services/jwt-token-generator';
import { OrganizationModule } from '../organization/organization.module';

import { RegisterUseCase } from './application/use-cases/auth/register.use-case';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { LoginWithGoogleUseCase } from './application/use-cases/auth/login-with-google.use-case';
import { CreateUserUseCase } from './application/use-cases/user/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/user/update-user.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/user/update-user-profile.use-case';
import { SetSuperadminUseCase } from './application/use-cases/user/set-superadmin.use-case';
import { GetUserUseCase } from './application/use-cases/user/get-user.use-case';
import { GetUsersUseCase } from './application/use-cases/user/get-users.use-case';
import { GetRolesUseCase } from './application/use-cases/role/get-roles.use-case';
import { GetRoleUseCase } from './application/use-cases/role/get-role.use-case';
import { UpdateRoleUseCase } from './application/use-cases/role/update-role.use-case';
import { CreateRoleUseCase } from './application/use-cases/role/create-role.use-case';
import { DeleteRoleUseCase } from './application/use-cases/role/delete-role.use-case';
import { GetRolesByDepartmentsUseCase } from './application/use-cases/role/get-roles-by-departments.use-case';
import { CreatePermissionUseCase } from './application/use-cases/permission/create-permission.use-case';
import { UpdatePermissionUseCase } from './application/use-cases/permission/update-permission.use-case';
import { DeletePermissionUseCase } from './application/use-cases/permission/delete-permission.use-case';
import { GetPermissionsUseCase } from './application/use-cases/permission/get-permissions.use-case';
import { CreateEndpointPermissionUseCase } from './application/use-cases/endpoint-permission/create-endpoint-permission.use-case';
import { UpdateEndpointPermissionUseCase } from './application/use-cases/endpoint-permission/update-endpoint-permission.use-case';
import { DeleteEndpointPermissionUseCase } from './application/use-cases/endpoint-permission/delete-endpoint-permission.use-case';
import { GetEndpointPermissionsUseCase } from './application/use-cases/endpoint-permission/get-endpoint-permissions.use-case';
import { MatchEndpointPermissionUseCase } from './application/use-cases/endpoint-permission/match-endpoint-permission.use-case';
import { GetModulesUseCase } from './application/use-cases/module/get-modules.use-case';
import { CreateAbacPolicyUseCase } from './application/use-cases/abac-policy/create-abac-policy.use-case';
import { GetAbacPoliciesUseCase } from './application/use-cases/abac-policy/get-abac-policies.use-case';
import { UpdateAbacPolicyUseCase } from './application/use-cases/abac-policy/update-abac-policy.use-case';
import { DeleteAbacPolicyUseCase } from './application/use-cases/abac-policy/delete-abac-policy.use-case';

import { InProcessPermCache } from './application/services/in-process-perm-cache.service';
import { UserPermCacheService } from './application/services/user-perm-cache.service';
import { AbacRuleEngineService } from './application/services/abac-rule-engine.service';
import { PermissionGuard } from './presentation/guards/permission.guard';
import { DynamicPolicyGuard } from './presentation/guards/dynamic-policy.guard';
import { SystemSecretGuard } from './presentation/guards/system-secret.guard';
import { SuperadminSecretGuard } from './presentation/guards/superadmin-secret.guard';

import { JwtStrategy } from './presentation/strategies/jwt.strategy';
import { GoogleStrategy } from './presentation/strategies/google.strategy';
import { LocalStrategy } from './presentation/strategies/local.strategy';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserController } from './presentation/controllers/user.controller';
import { RoleController } from './presentation/controllers/role.controller';
import { PermissionController } from './presentation/controllers/permission.controller';
import { EndpointPermissionController } from './presentation/controllers/endpoint-permission.controller';
import { ModuleController } from './presentation/controllers/module.controller';
import { AbacPolicyController } from './presentation/controllers/abac-policy.controller';
import { UserCheckingAdapter } from './infrastructure/adapters/user-checking.adapter';
import { InternalUserCheckingAdapter } from './infrastructure/adapters/InternalUserCheckingAdapter';
import { OrganizationMongooseModule } from '../organization/infrastructure/persistence/mongoose.module';
// import { InternalUserRepository } from '../organization/infrastructure/persistence/repositories';

export const PASSWORD_HASHER = 'PasswordHasherPort';
export const TOKEN_GENERATOR = 'TokenGeneratorPort';

const useCases = [
  RegisterUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  LoginWithGoogleUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  UpdateUserProfileUseCase,
  SetSuperadminUseCase,
  GetUserUseCase,
  GetUsersUseCase,
  GetRolesUseCase,
  GetRoleUseCase,
  UpdateRoleUseCase,
  CreateRoleUseCase,
  DeleteRoleUseCase,
  GetRolesByDepartmentsUseCase,
  CreatePermissionUseCase,
  UpdatePermissionUseCase,
  DeletePermissionUseCase,
  GetPermissionsUseCase,
  CreateEndpointPermissionUseCase,
  UpdateEndpointPermissionUseCase,
  DeleteEndpointPermissionUseCase,
  GetEndpointPermissionsUseCase,
  MatchEndpointPermissionUseCase,
  GetModulesUseCase,
  CreateAbacPolicyUseCase,
  GetAbacPoliciesUseCase,
  UpdateAbacPolicyUseCase,
  DeleteAbacPolicyUseCase,
];

@Module({
  imports: [
    forwardRef(() => OrganizationModule),
    OrganizationMongooseModule,
    IdentityMongooseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwtAccessSecret,
        signOptions: {
          expiresIn: configService.jwtAccessExpiration,
        },
      } as any),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UserController, RoleController, PermissionController, EndpointPermissionController, ModuleController, AbacPolicyController],
  providers: [
    ...useCases,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_GENERATOR, useClass: JwtTokenGenerator },
    UserCheckingAdapter,
    InternalUserCheckingAdapter,
    JwtStrategy,
    GoogleStrategy,
    LocalStrategy,
    JwtAuthGuard,
    PermissionGuard,
    SystemSecretGuard,
    SuperadminSecretGuard,
    DynamicPolicyGuard,
    InProcessPermCache,
    { provide: 'IPermissionCacheService', useExisting: InProcessPermCache },
    UserPermCacheService,
    AbacRuleEngineService,
  ],
  exports: [...useCases, PASSWORD_HASHER, TOKEN_GENERATOR, JwtAuthGuard, UserCheckingAdapter, InternalUserCheckingAdapter, UserPermCacheService, PermissionGuard, DynamicPolicyGuard, AbacRuleEngineService, SystemSecretGuard, IdentityMongooseModule],
})
export class IdentityModule {}
