import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { configuration } from './config/configuration';
import { ConfigService } from './config/config.service';
import { AppConfigModule } from './config/config.module';
import { SharedModule } from './shared/shared.module';
import { IdentityModule } from './domains/identity/identity.module';
import { JwtAuthGuard } from './domains/identity/presentation/guards/jwt-auth.guard';
import { PermissionGuard } from './domains/identity/presentation/guards/permission.guard';
import { DynamicPolicyGuard } from './domains/identity/presentation/guards/dynamic-policy.guard';
import { AssetModule } from './domains/asset/asset.module';
import { OrganizationModule } from './domains/organization/organization.module';
import { ActivityLogModule } from './domains/activity-log/activity-log.module';
import { BookingRoomModule } from './domains/booking-room/booking-room.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    AppConfigModule,
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: `${configService.mongodbUri}${configService.mongodbDbName}`,
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    IdentityModule,
    AssetModule,
    OrganizationModule,
    ActivityLogModule,
    BookingRoomModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: DynamicPolicyGuard },
  ],
})
export class AppModule {}
