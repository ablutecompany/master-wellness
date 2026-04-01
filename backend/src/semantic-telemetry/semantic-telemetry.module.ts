import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SemanticTelemetryController } from './semantic-telemetry.controller';
import { SemanticTelemetryService } from './semantic-telemetry.service';

@Module({
  controllers: [SemanticTelemetryController],
  providers: [SemanticTelemetryService, PrismaService],
  exports: [SemanticTelemetryService]
})
export class SemanticTelemetryModule {}
