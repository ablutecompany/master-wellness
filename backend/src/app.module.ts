import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
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
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';
import { AnalysisModule } from './analysis/analysis.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'preview')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        SUPABASE_URL: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
        CORS_ALLOWED_ORIGINS: Joi.string().required(),
        CORS_ALLOWED_ORIGIN_REGEX: Joi.string().optional(),
      }),
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
    AnalysisModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
