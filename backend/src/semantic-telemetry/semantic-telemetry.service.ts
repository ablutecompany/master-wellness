import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SemanticTelemetryEvent } from './types';

@Injectable()
export class SemanticTelemetryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Persistir um evento de telemetria semântica.
   * Garante separação total de dados biométricos, registando apenas a interação funcional.
   */
  async recordEvent(event: SemanticTelemetryEvent) {
    return this.prisma.auditEvent.create({
      data: {
        actorType: 'user',
        actorId: 'system', // Em produção, extrair do contexto de sessão
        eventType: event.eventType,
        targetType: 'domain_semantic_bundle',
        targetId: event.bundleVersion,
        payload: {
          domain: event.domain,
          screen: event.screen,
          status: event.status,
          insightIds: event.insightIds,
          recommendationIds: event.recommendationIds,
          suppressedRecommendationIds: event.suppressedRecommendationIds,
          suppressionReason: event.suppressionReason,
          evidenceRefIds: event.evidenceRefIds,
          sessionId: event.sessionId,
          source: event.source,
          fingerprint: event.fingerprint,
          semanticVersion: event.semanticVersion,
          timestamp: new Date(event.timestamp).toISOString()
        }
      }
    });
  }

  /**
   * Consulta interna para auditoria temporal e rastro biográfico.
   */
  async getEvents(filters: {
    domain?: string;
    sessionId?: string;
    eventType?: string;
    bundleVersion?: string;
  }) {
    return this.prisma.auditEvent.findMany({
      where: {
        targetType: 'domain_semantic_bundle',
        ...(filters.domain && { payload: { path: ['domain'], equals: filters.domain } }),
        ...(filters.sessionId && { payload: { path: ['sessionId'], equals: filters.sessionId } }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.bundleVersion && { targetId: filters.bundleVersion })
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
