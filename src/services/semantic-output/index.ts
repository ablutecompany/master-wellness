/**
 * SEMANTIC OUTPUT SERVICE v1.2.0
 * Hardened Lifecycle: Partial Bundle & isStale Alignment
 */

import { AppState } from 'react-native';
import { SemanticOutputStore } from './store';
import { SemanticDomainView, SemanticOutputStatus } from './types';
import { DomainAffinity } from './domain-affinity';
import { SemanticGuardrails } from './guardrails';

export class SemanticOutputService {
  private static isInitialized = false;

  /**
   * Inicialização operacional: Ligar ao Lifecycle da App.
   */
  static init(userId: string) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.checkFreshnessAndRevalidate(userId);
      }
    });

    this.refreshBundle(userId);
  }

  /**
   * Sinalizar alteração biográfica via Medição.
   */
  static markDirtyFromMeasurement(userId: string, type: string) {
    const affected = DomainAffinity.resolveFromMeasurement(type);
    affected.forEach(domain => {
      SemanticOutputStore.markDirty(domain, () => this.refreshBundle(userId));
    });
  }

  /**
   * Sinalizar alteração biográfica via App / Evento.
   */
  static markDirtyFromContribution(userId: string, appId: string, eventType?: string) {
    let affected = DomainAffinity.resolveFromApp(appId);
    
    if (eventType) {
      const eventAffected = DomainAffinity.resolveFromEvent(eventType);
      affected = [...new Set([...affected, ...eventAffected])];
    }

    affected.forEach(domain => {
      SemanticOutputStore.markDirty(domain, () => this.refreshBundle(userId));
    });
  }

  /**
   * Obtenção do Bundle Semântico (v1.2.0).
   * Alinhamento de isStale e lastComputedAt.
   */
  static async refreshBundle(userId: string, isRetry = false) {
    const currentState = SemanticOutputStore.getState();
    const statusBefore = currentState.status;
    const requestedDomains = SemanticOutputStore.getDirtyDomains();

    if (statusBefore === 'ready' || statusBefore === 'insufficient_data') {
      SemanticOutputStore.setStatus('refreshing');
    } else {
      SemanticOutputStore.setStatus('loading');
    }

    try {
      const response = await this.fetchFromBackend(userId, requestedDomains);

      if (!response || response.bundleVersion !== '1.2.0') {
        throw new Error('Falha de Versão Semântica v1.2.0');
      }

      const adapted = this.adaptBundle(response);
      
      SemanticOutputStore.updateState({
        generatedAt: response.generatedAt,
        domains: adapted,
        status: this.resolveGlobalStatus(adapted), // Decisão governada de status global
        crossDomainSummary: response.crossDomainSummary,
        isLive: true
      });

      SemanticOutputStore.updateMetadata({
        lastUpdatedAt: Date.now(),
        lastRequestedAt: Date.now(),
        retryCount: 0
      });

      SemanticOutputStore.clearDirty();

    } catch (e: any) {
      console.error('[Semantic Operational] Falha:', e.message);
      this.handleError(userId, isRetry);
    }
  }

  private static resolveGlobalStatus(domains: Record<string, SemanticDomainView>): SemanticOutputStatus {
    const v = Object.values(domains);
    
    // Se existir algum 'ready' (sufficient_data e não stale), o bundle global é ready
    if (v.some(d => d.status === 'sufficient_data' && !d.isStale)) return 'ready';
    
    // Se não houver ready, mas houver stale, o bundle global é stale
    if (v.some(d => d.isStale)) return 'stale';
    
    // Se tudo for insuficiente
    if (v.every(d => d.status === 'insufficient_data')) return 'insufficient_data';
    
    return 'ready';
  }

  private static checkFreshnessAndRevalidate(userId: string) {
    const { metadata, status } = SemanticOutputStore.getState();
    const now = Date.now();
    const age = now - metadata.lastUpdatedAt;

    if (status === 'ready' && (age > metadata.staleAfterMs || metadata.isDirty)) {
      this.refreshBundle(userId);
    }
  }

  private static handleError(userId: string, wasRetry: boolean) {
    const meta = SemanticOutputStore.getState().metadata;
    const newRetryCount = meta.retryCount + 1;

    SemanticOutputStore.updateMetadata({ lastErrorAt: Date.now(), retryCount: newRetryCount });

    if (newRetryCount <= 2) {
      setTimeout(() => this.refreshBundle(userId, true), 2000 * newRetryCount);
    } else {
      SemanticOutputStore.setStatus('error');
    }
  }

  private static async fetchFromBackend(userId: string, requestedDomains: string[]) {
    // Simulação do Motor de Verdade Determinístico v1.2.0 (Backend alinhado)
    // O backend já envia 'isStale' e 'lastComputedAt'.
    return {
      bundleVersion: '1.2.0',
      generatedAt: Date.now(),
      domains: {
        sleep: { score: { value: 85, status: 'sufficient_data', stateLabel: 'Regular' }, insights: [], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        nutrition: { score: { value: 65, status: 'sufficient_data', stateLabel: 'Equilibrado' }, insights: [], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        general: { score: { value: 72, status: 'sufficient_data', stateLabel: 'Saudável' }, insights: [], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        energy: { score: { value: 78, status: 'sufficient_data', stateLabel: 'Energético' }, insights: [], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        recovery: { score: { value: 90, status: 'sufficient_data', stateLabel: 'Recuperado' }, insights: [], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        performance: { score: { value: 85, status: 'sufficient_data', stateLabel: 'Estável' }, insights: [], recommendations: [], isStale: false, lastComputedAt: Date.now() }
      },
      crossDomainSummary: {
        summary: 'Ecossistema Global Biográfico Estreitamente Alinhado.',
        coherenceFlags: ['multi_domain_sync_active'],
        prioritySignals: [],
        deduplicatedRecommendations: []
      }
    };
  }

  private static adaptBundle(raw: any): Record<string, SemanticDomainView> {
    const adapted: Record<string, SemanticDomainView> = {};
    const domainsToMap = ['sleep', 'nutrition', 'general', 'energy', 'recovery', 'performance'];

    for (const d of domainsToMap) {
      const source = raw.domains?.[d];
      adapted[d] = this.adaptDomain(d, source || { status: 'unavailable', isStale: true });
    }
    return adapted;
  }

  private static adaptDomain(domain: string, source: any): SemanticDomainView {
    // RESOLUÇÃO DE STATUS: isStale tem precedência operacional
    const baseStatus = source.score?.status || (source.status as any) || 'unavailable';
    const status = source.isStale ? 'stale' : baseStatus;

    return {
      domain,
      label: domain,
      score: source.score?.value || 0,
      status,
      statusLabel: source.score?.stateLabel || 'Indisponível',
      band: source.score?.band || 'poor',
      generatedAt: source.generatedAt || Date.now(),
      lastComputedAt: source.lastComputedAt || 0,
      isStale: !!source.isStale,
      version: '1.2.0',
      mainInsight: source.insights?.[0],
      recommendations: source.recommendations || []
    };
  }

  private static isAnySufficient(domains: Record<string, SemanticDomainView>): boolean {
    return Object.values(domains).some(d => d.status === 'sufficient_data');
  }

  // Pass-through
  static subscribe(callback: () => void) { return SemanticOutputStore.subscribe(callback); }
  static getState() { return SemanticOutputStore.getState(); }
  static getBundle() { 
    const bundle = SemanticOutputStore.getState();
    const isValid = SemanticGuardrails.assertValidBundleConsumption(bundle);
    if (!isValid && !__DEV__) {
      return { ...bundle, status: 'error' } as any;
    }
    return bundle; 
  }
  static getStatus() { return SemanticOutputStore.getState().status; }
  static getDomainOutput(domain: string) { 
    const output = SemanticOutputStore.getState().domains[domain];
    const isValid = SemanticGuardrails.assertFactualFidelity(output, `Domain:${domain}`);
    if (!isValid && !__DEV__ && output) {
       return { ...output, status: 'error' };
    }
    return output;
  }
  static getCrossDomainSummary() {
    return SemanticOutputStore.getState().crossDomainSummary;
  }
}

export const semanticOutputService = SemanticOutputService;
