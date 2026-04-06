import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { SemanticTelemetryService } from './semantic-telemetry.service';
import type { SemanticTelemetryEvent } from './types';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('semantic-telemetry')
@UseGuards(AuthGuard, RolesGuard)
export class SemanticTelemetryController {
  constructor(private service: SemanticTelemetryService) {}

  /**
   * Endpoint de receção de eventos de consumo semântico.
   * Recebe e persiste o rastro de rastro funcional sem dados biométricos.
   */
  @Post('event')
  @Roles(UserRole.END_USER, UserRole.MINIAPP_RUNTIME, UserRole.SERVICE_BACKEND, UserRole.ADMIN_INTERNAL)
  async recordEvent(@Body() event: SemanticTelemetryEvent) {
    await this.service.recordEvent(event);
    return { status: 'recorded' };
  }

  /**
   * Consulta interna para rastro de auditoria (audit-ready).
   */
  @Get('query')
  @Roles(UserRole.OPS_INTERNAL, UserRole.ADMIN_INTERNAL, UserRole.SERVICE_BACKEND)
  async queryEvents(
    @Query('domain') domain?: string,
    @Query('sessionId') sessionId?: string,
    @Query('eventType') eventType?: string,
    @Query('bundleVersion') bundleVersion?: string
  ) {
    return this.service.getEvents({ domain, sessionId, eventType, bundleVersion });
  }
}
