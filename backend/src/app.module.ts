import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MeasurementModule } from './measurement/measurement.module';
import { ThemeModule } from './theme-engine/theme-engine.module';
import { CreditsModule } from './credits/credits.module';
import { AddonsModule } from './addons/addons.module';
import { EquipmentModule } from './equipment/equipment.module';
import { NotificationModule } from './notifications/notification.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigService globalmente disponível em todos os módulos
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    MeasurementModule,
    ThemeModule,
    CreditsModule,
    AddonsModule,
    EquipmentModule,
    NotificationModule,
    AuditModule,
    AdminModule,
    AiGatewayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
