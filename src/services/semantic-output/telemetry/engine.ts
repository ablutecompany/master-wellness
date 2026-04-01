import { SemanticTelemetryEvent, SemanticTelemetryEventType } from './types';

class SemanticTelemetryEngine {
  private sessionId: string;
  private emittedFingerprints: Set<string> = new Set();

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Registar um evento de telemetria semântica com deduplicação determinística.
   */
  async record(event: Omit<SemanticTelemetryEvent, 'sessionId' | 'timestamp'>) {
    const timestamp = Date.now();
    const fingerprint = this.generateFingerprint(event);

    // Evitar flood por re-render se os dados biográficos não mudaram
    if (this.emittedFingerprints.has(fingerprint)) {
      return;
    }

    this.emittedFingerprints.add(fingerprint);

    const fullEvent: SemanticTelemetryEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp
    };

    try {
      // In production, use the centralized API client
      console.log(`[SemanticTelemetry] Recording: ${event.eventType} - Domain: ${event.domain}`);
      
      // Simulação de rastro de rastro funcional
      // await fetch(`${BACKEND_URL}/semantic-telemetry/event`, {
      //   method: 'POST',
      //   body: JSON.stringify(fullEvent),
      //   headers: { 'Content-Type': 'application/json' }
      // });
    } catch (e) {
      console.error('[SemanticTelemetry] Recording failed:', e);
    }
  }

  private generateFingerprint(event: Omit<SemanticTelemetryEvent, 'sessionId' | 'timestamp'>): string {
    // Fingerprint endurecido: (ecrã, domínio, status, bundle, tipo, conteúdo-específico)
    const insightPart = event.insightIds.join(',');
    const recPart = event.recommendationIds.join(',');
    const suppressedPart = (event.suppressedRecommendationIds || []).join(',');
    
    return `${event.screen}_${event.domain}_${event.status}_${event.bundleVersion}_${event.eventType}_${insightPart}_${recPart}_${suppressedPart}`;
  }

  getSessionId() {
    return this.sessionId;
  }
}

export const semanticTelemetry = new SemanticTelemetryEngine();
