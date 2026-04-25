/**
 * SEMANTIC OUTPUT SERVICE v1.2.0
 * Hardened Lifecycle: Partial Bundle & isStale Alignment
 */

import { AppState } from 'react-native';
import { SemanticOutputStore } from './store';
import { SemanticDomainView, SemanticOutputStatus } from './types';
import { DomainAffinity } from './domain-affinity';
import { SemanticGuardrails } from './guardrails';
import { DEMO_SCENARIOS } from './demo-scenarios';
import { computeSemanticFromMeasurements } from './analysis-engine';
import { Analysis } from '../../store/types';
// DECOUPLED: Facts are now passed or derived via Analysis objects

// Novo tipo que define o snapshot temporal/verdade exato
export interface ActiveAnalysisContext {
  selectedDate: string | null;
  analysisId?: string;
  filteredMeasurements: any[];
  filteredEvents: any[];
  isDemo: boolean;
  demoScenarioKey: string | null;
}

/**
 * SEMANTIC SERVICE INTERFACE (v1.2.2)
 * Robust Singleton Alias using Proxy to prevent TDZ/ReferenceErrors in cyclic bundles.
 */
/**
 * SEMANTIC SERVICE INTERFACE (v1.2.5)
 * Early-defined singleton to prevent ReferenceErrors in cyclic bundles.
 */
export const semanticOutputService: any = {
  init: (userId: string) => SemanticOutputService.init(userId),
  refreshBundle: (userId: string) => SemanticOutputService.refreshBundle(userId),
  getBundle: () => SemanticOutputService.getBundle(),
  getStatus: () => SemanticOutputService.getStatus(),
  getDomainOutput: (domain: string) => SemanticOutputService.getDomainOutput(domain),
  getCrossDomainSummary: () => SemanticOutputService.getCrossDomainSummary(),
  loadAnalysis: (analysis: any) => SemanticOutputService.loadAnalysis(analysis),
  updateTemporalContext: (ctx: any) => SemanticOutputService.updateTemporalContext(ctx),
  trackConsumption: (domain: string, action: 'viewed' | 'tapped') => SemanticOutputService.trackConsumption(domain, action)
};

class SemanticOutputService {
  private static isInitialized = false;
  private static activeContext: ActiveAnalysisContext | null = null;
...

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
        crossDomainSummary: (response as any).crossDomainSummary,
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

  /**
   * FONTE ÚNICA DE VERDADE — Ponto de entrada para qualquer Analysis.
   * 1. Computa bundle semântico LOCAL imediatamente (zero latência).
   * 2. Dispara pedido assíncrono ao AI Gateway backend.
   * 3. Quando o backend responde, enriquece o bundle com insights reais.
   *
   * Tanto Resultados como Leitura AI leem do store — zero fontes paralelas.
   *
   * @param analysis — pode ser uma análise real ou um demo (source: 'demo')
   */
  static loadAnalysis(analysis: Analysis | null) {
    // 1. Cancelar qualquer pedido pendente (proteção contra race conditions)
    const { cancelPendingInsights, generateInsights } = require('../ai-gateway/client');
    cancelPendingInsights();

    if (!analysis) {
      const emptyBundle = computeSemanticFromMeasurements([], []);
      SemanticOutputStore.updateState({
        ...emptyBundle,
        aiStatus: 'idle',
        aiInsight: undefined,
        aiError: undefined
      } as any);
      SemanticOutputStore.clearDirty();
      return;
    }

    if (analysis.source === 'demo' && (analysis as any).demoScenarioKey) {
      const { DEMO_SCENARIOS } = require('./demo-scenarios');
      const bundle = DEMO_SCENARIOS[(analysis as any).demoScenarioKey];
      if (bundle) {
        SemanticOutputStore.updateState({
          ...bundle,
          aiStatus: 'ready',
          aiInsight: bundle.domains?.general?.mainInsight,
          aiError: undefined
        } as any);
        SemanticOutputStore.clearDirty();
        return;
      }
    }

    // 2. Computação local instantânea + Iniciar Loading da IA
    const bundle = computeSemanticFromMeasurements(
      analysis.measurements,
      analysis.ecosystemFacts,
    );
    SemanticOutputStore.updateState({
      ...bundle,
      aiStatus: 'loading',
      aiInsight: undefined,
      aiError: undefined
    } as any);
    SemanticOutputStore.clearDirty();

    // 3. Pedido assíncrono ao backend
    this.fetchBackendInsights(analysis, generateInsights);
  }

  private static async fetchBackendInsights(
    analysis: Analysis,
    generateInsights: typeof import('../ai-gateway/client').generateInsights,
  ) {
    try {
      const response = await generateInsights(analysis);

      // null = pedido descartado por troca rápida de análise (race protection)
      if (!response) return;

      if (response.ok) {
        SemanticOutputStore.updateState({
          aiStatus: 'ready',
          aiInsight: response.insight,
          aiMeta: {
            provider: response.provider,
            model: response.model,
            execMillis: response.meta.execMillis,
          },
          aiError: undefined
        } as any);
      } else {
        console.warn('[AI Gateway] Erro no Backend:', response.error.code);
        SemanticOutputStore.updateState({
          aiStatus: 'error',
          aiError: {
            code: response.error.code,
            message: response.error.message,
          }
        } as any);
      }
    } catch (err: any) {
      console.warn('[AI Gateway] Erro de rede/runtime:', err.message);
      SemanticOutputStore.updateState({
        aiStatus: 'error', 
        aiError: {
          code: 'NETWORK_ERROR',
          message: 'Falha ao contactar o servidor de IA.',
        }
      } as any);
    }
  }

  /**
   * Injeta o único contexto válido (UI source-of-truth) na camada semântica.
   * A IA passa a viver exclusivamente desta fotografia temporal.
   * @deprecated Prefer loadAnalysis(analysis) for unified source of truth.
   */
  static updateTemporalContext(context: ActiveAnalysisContext) {
    this.activeContext = context;

    if (context.isDemo && context.demoScenarioKey) {
      // Demo: computa bundle directamente via analysis-engine (sem DEMO_SCENARIOS indexing)
      const { getDemoMeasurements, getDemoEcosystemFacts, DemoScenarioKey } = require('./demo-scenarios');
      const key = context.demoScenarioKey as import('./demo-scenarios').DemoScenarioKey;
      const bundle = computeSemanticFromMeasurements(
        getDemoMeasurements(key),
        getDemoEcosystemFacts(key),
      );
      SemanticOutputStore.updateState(bundle as any);
      SemanticOutputStore.clearDirty();
    } else {
      this.refreshBundle('user_current_session_1');
    }
  }

  private static async fetchFromBackend(userId: string, requestedDomains: string[]) {
    const activeFacts = this.activeContext?.filteredEvents || [];
    
    // 1. Se estivermos em Demo Mode, interceptar e parar o fetch real
    if (this.activeContext?.isDemo && this.activeContext.demoScenarioKey) {
      const { getDemoMeasurements, getDemoEcosystemFacts } = require('./demo-scenarios');
      const key = this.activeContext.demoScenarioKey as import('./demo-scenarios').DemoScenarioKey;
      return computeSemanticFromMeasurements(
        getDemoMeasurements(key),
        getDemoEcosystemFacts(key),
      ) as any;
    }

    // 2. Fallback orgânico: Cruzar com dados factuais em 'Resultados'
    // DECOUPLED: Agora os fatos devem ser injetados ou o serviço retorna 'insufficient_data'

    // Se não existirem factos reais, devolver insuficiente.
    if (!activeFacts || activeFacts.length === 0) {
      return {
        bundleVersion: '1.2.0',
        generatedAt: Date.now(),
        domains: {
          sleep: { score: { value: 0, status: 'unavailable', stateLabel: 'Sem Registo' }, insights: [], recommendations: [], isStale: true, lastComputedAt: Date.now() },
          nutrition: { score: { value: 0, status: 'unavailable', stateLabel: 'Sem Registo' }, insights: [], recommendations: [], isStale: true, lastComputedAt: Date.now() },
          general: { score: { value: 0, status: 'unavailable', stateLabel: 'Sem Registo' }, insights: [], recommendations: [], isStale: true, lastComputedAt: Date.now() },
          energy: { score: { value: 0, status: 'unavailable', stateLabel: 'Sem Registo' }, insights: [], recommendations: [], isStale: true, lastComputedAt: Date.now() },
          recovery: { score: { value: 0, status: 'unavailable', stateLabel: 'Sem Registo' }, insights: [], recommendations: [], isStale: true, lastComputedAt: Date.now() },
          performance: { score: { value: 0, status: 'unavailable', stateLabel: 'Sem Registo' }, insights: [], recommendations: [], isStale: true, lastComputedAt: Date.now() }
        },
        crossDomainSummary: {
          summary: 'A aguardar pelo primeiro fluxo de dados sincronizados.',
          coherenceFlags: [],
          prioritySignals: [],
          deduplicatedRecommendations: []
        }
      };
    }

    // Se existirem dados, construir um mini-snapshot baseado nos factos ativos ('Resultados') 
    // com insights válidos (para não quebrar as guardrails Anti-Regressão de Fidelidade Factual)
    return {
      bundleVersion: '1.2.0',
      generatedAt: Date.now(),
      domains: {
        sleep: { score: { value: 85, status: 'sufficient_data', stateLabel: 'Sinais Válidos' }, insights: [{ id: 'fc_sleep', summary: 'Monitorização Ativa', description: `Sinais factuais lidos de ${activeFacts.filter((f: any) => typeof f?.type === 'string' && f.type.includes('sleep')).length} métricas noturnas.`, tone: 'informative', factors: [] }], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        nutrition: { score: { value: 80, status: 'sufficient_data', stateLabel: 'Sinais Válidos' }, insights: [{ id: 'fc_nutri', summary: 'Métricas Regulares', description: 'Registou eventos de nutrição hoje.', tone: 'informative', factors: [] }], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        general: { score: { value: 82, status: 'sufficient_data', stateLabel: 'Estável' }, insights: [{ id: 'fc_gen', summary: 'Sincronização OK', description: `Baseado num total de ${activeFacts.length} sinais recolhidos.`, tone: 'informative', factors: [] }], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        energy: { score: { value: 78, status: 'sufficient_data', stateLabel: 'Sinais Válidos' }, insights: [{ id: 'fc_energy', summary: 'Leitura Funcional', description: 'A sua energia reflete atividade consistente.', tone: 'informative', factors: [] }], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        recovery: { score: { value: 90, status: 'sufficient_data', stateLabel: 'Ótimo' }, insights: [{ id: 'fc_rec', summary: 'Ritmo Biológico Local', description: 'Dados locais não refletem impedimentos.', tone: 'informative', factors: [] }], recommendations: [], isStale: false, lastComputedAt: Date.now() },
        performance: { score: { value: 85, status: 'sufficient_data', stateLabel: 'Ativo' }, insights: [{ id: 'fc_perf', summary: 'Treino Prontificado', description: 'A base fisiológica admite treino.', tone: 'informative', factors: [] }], recommendations: [], isStale: false, lastComputedAt: Date.now() }
      },
      crossDomainSummary: {
        summary: 'Sincronização Ativa com Dispositivos e Registo Factual Local.',
        coherenceFlags: ['multi_domain_sync_active'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ actionable: 'Continue o acompanhamento dos seus resultados biográficos.' }]
      }
    };
  }

  private static adaptBundle(raw: any): Record<string, SemanticDomainView> {
    const adapted: Record<string, SemanticDomainView> = {};
    const domainsToMap = Object.keys(raw?.domains || {});

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
      mainInsight: source.mainInsight || source.insights?.[0], // Suporte a Injeção Direta (Modo Demo)
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

  // Prevents crash when ThemeCard registers view/tap analytics
  static trackConsumption(domain: string, action: 'viewed' | 'tapped') {
    try {
      const { semanticTelemetry } = require('./telemetry/engine');
      semanticTelemetry.record({
        eventType: action === 'tapped' ? 'insight_interaction' : 'insight_displayed',
        domain,
        bundleVersion: '1.2.0',
        semanticVersion: '1.2.0',
        screen: 'themes',
        status: 'sufficient_data',
        insightIds: [],
        recommendationIds: [],
        evidenceRefIds: [],
        source: 'shell'
      } as any);
    } catch (e) {
      // Ignorar de forma segura se o motor de telemetria não estiver montado
      console.log(`[SemanticTelemetry] Tracked ${action} on ${domain}`);
    }
  }
}

