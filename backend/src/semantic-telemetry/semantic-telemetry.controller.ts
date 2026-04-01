import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SemanticTelemetryService } from './semantic-telemetry.service';
import { SemanticTelemetryEvent } from './types';

@Controller('semantic-telemetry')
export class SemanticTelemetryController {
  constructor(private service: SemanticTelemetryService) {}

  /**
   * Endpoint de receção de eventos de consumo semântico.
   * Recebe e persiste o rastro de rastro funcional sem dados biométricos.
   */
  @Post('event')
  async recordEvent(@Body() event: SemanticTelemetryEvent) {
    await this.service.recordEvent(event);
    return { status: 'recorded' };
  }

  /**
   * Consulta interna para rastro de auditoria (audit-ready).
   */
  @Get('query')
  async queryEvents(
    @Query('domain') domain?: string,
    @Query('sessionId') sessionId?: string,
    @Query('eventType') eventType?: string,
    @Query('bundleVersion') bundleVersion?: string
  ) {
    return this.service.getEvents({ domain, sessionId, eventType, bundleVersion });
  }
}
