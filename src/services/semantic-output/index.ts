import { SemanticBundle, DomainOutput, DomainType } from './types';

/**
 * Semantic Output Service (Frontend)
 * Responsible for consuming, caching and distributing the multi-domain semantic bundle.
 */

import { semanticTelemetry } from './telemetry/engine';

class SemanticOutputService {
  private currentBundle: SemanticBundle | null = null;
  private subscribers: ((bundle: SemanticBundle) => void)[] = [];

  /**
   * Actualizar o estado semântico global a partir do backend.
   */
  updateBundle(bundle: SemanticBundle) {
    this.currentBundle = bundle;
    
    // Telemetria: Bundle recebido na Shell
    semanticTelemetry.record({
      eventType: 'semantic_bundle_received',
      domain: 'all',
      bundleVersion: bundle.bundleVersion,
      semanticVersion: '1.2.0',
      screen: 'home',
      status: 'sufficient_data',
      insightIds: [],
      recommendationIds: [],
      evidenceRefIds: [],
      source: 'shell'
    });

    this.notifySubscribers();
  }

  getBundle(): SemanticBundle | null {
    return this.currentBundle;
  }

  /**
   * Obter o output específico de um domínio com segurança de falha.
   */
  getDomainOutput(domain: DomainType): DomainOutput | null {
    if (!this.currentBundle || !this.currentBundle.domains[domain]) {
      return null;
    }
    return this.currentBundle.domains[domain];
  }

  /**
   * Subscrever a alterações no bundle semântico (útil para Screens/Hooks).
   */
  subscribe(callback: (bundle: SemanticBundle) => void) {
    this.subscribers.push(callback);
    if (this.currentBundle) callback(this.currentBundle);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notifySubscribers() {
    if (this.currentBundle) {
      this.subscribers.forEach(s => s(this.currentBundle!));
    }
  }

  /**
   * Helpers de Interpretação (v1.2)
   */
  isDataSufficient(domain: DomainType): boolean {
    const output = this.getDomainOutput(domain);
    return output?.status === 'sufficient_data';
  }

  hasRecommendations(domain: DomainType): boolean {
    const output = this.getDomainOutput(domain);
    return (output?.recommendations?.length || 0) > 0;
  }

  /**
   * Track that an insight has been consumed by the user.
   */
  async trackConsumption(domain: DomainType, action: 'viewed' | 'tapped' = 'viewed') {
    const output = this.getDomainOutput(domain);
    if (!output || !this.currentBundle) return;

    const insightId = output.insights[0]?.id || `${domain}_${this.currentBundle.bundleVersion}`;
    
    // Telemetria: Consumo efetivo (viewed/tapped)
    semanticTelemetry.record({
      eventType: action === 'viewed' ? 'semantic_card_viewed' : 'insight_displayed', // Tapped assume Display total
      domain,
      bundleVersion: this.currentBundle.bundleVersion,
      semanticVersion: '1.2.0',
      screen: 'home',
      cardId: insightId,
      status: output.status,
      insightIds: output.insights.map(i => i.id),
      recommendationIds: output.recommendations.map(r => r.id),
      evidenceRefIds: output.inputSummary.trace,
      source: 'shell'
    });
  }
}

export const semanticOutputService = new SemanticOutputService();
