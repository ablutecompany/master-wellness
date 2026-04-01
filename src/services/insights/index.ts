import { theme } from '../../theme';
import { AppState } from '../../store/useStore';
import { semanticOutputService } from '../semantic-output';
import { DomainType } from '../semantic-output/types';
import { semanticTelemetry } from '../semantic-output/telemetry/engine';

export interface UIInsight {
  title: string;
  iconName?: 'Activity' | 'Zap' | 'Target' | 'Heart' | 'Moon' | 'Brain' | 'User';
  score?: number;
  textValue?: string;
  
  // Para ThemeCard
  paragraph1: string;
  paragraph2: string;
  refText1: string;
  refText2: string;
  suggestions?: { title: string; desc: string }[];
  domain: DomainType;
}

/**
 * NOVO: Obter insights a partir do Semantic Bundle (v1.2.0)
 * Esta é agora a única fonte de verdade para a Shell.
 */
export function getSemanticInsights(): UIInsight[] {
  const bundle = semanticOutputService.getBundle();
  if (!bundle) {
    // Telemetria: Falha de recepção do rastro semântico
    return generateFallbackInsights();
  }

  const domains: DomainType[] = ['performance', 'energy', 'recovery', 'sleep', 'nutrition'];
  
  return domains.map(d => {
    const output = bundle.domains[d];
    
    // ── TELEMETRIA DE ESTADO ──
    if (!output || output.status === 'unavailable' || output.status === 'insufficient_data') {
      semanticTelemetry.record({
        eventType: output?.status === 'insufficient_data' ? 'insufficient_data_state_displayed' : 'unavailable_state_displayed',
        domain: d,
        bundleVersion: bundle.bundleVersion,
        semanticVersion: '1.2.0',
        screen: 'home',
        status: output?.status || 'unavailable',
        insightIds: [],
        recommendationIds: [],
        evidenceRefIds: output?.inputSummary.trace || [],
        source: 'shell'
      });
      return generateSingleDomainFallback(d);
    }

    const mainInsight = output.insights[0];
    const allRecommendations = output.recommendations;
    
    // ── LÓGICA DE SUPRESSÃO (UX/COERÊNCIA) ──
    // Regra: Mostrar apenas as 3 recomendações de maior prioridade na UI
    const visibleRecs = allRecommendations.slice(0, 3);
    const suppressedRecs = allRecommendations.slice(3);

    // ── TELEMETRIA DE CONSUMO & SUPRESSÃO ──
    
    // 1. Insight Displayed (Ponto Central de Verdade)
    semanticTelemetry.record({
      eventType: 'insight_displayed',
      domain: d,
      bundleVersion: bundle.bundleVersion,
      semanticVersion: '1.2.0',
      screen: 'home',
      status: output.status,
      insightIds: [mainInsight?.id].filter(Boolean) as string[],
      recommendationIds: [], // Separado para evitar redundância ruidosa
      evidenceRefIds: output.inputSummary.trace,
      source: 'shell'
    });

    // 2. Recommendations Displayed (Só se houver visíveis)
    if (visibleRecs.length > 0) {
      semanticTelemetry.record({
        eventType: 'recommendation_displayed',
        domain: d,
        bundleVersion: bundle.bundleVersion,
        semanticVersion: '1.2.0',
        screen: 'home',
        status: output.status,
        insightIds: [],
        recommendationIds: visibleRecs.map(r => r.id),
        evidenceRefIds: [],
        source: 'shell'
      });
    }

    // 3. UI Limitation Suppression
    if (suppressedRecs.length > 0) {
      semanticTelemetry.record({
        eventType: 'recommendation_not_rendered_ui_limit',
        domain: d,
        bundleVersion: bundle.bundleVersion,
        semanticVersion: '1.2.0',
        screen: 'home',
        status: output.status,
        insightIds: [],
        recommendationIds: [],
        suppressedRecommendationIds: suppressedRecs.map(r => r.id),
        suppressionReason: 'coherence_rule_ux_limit',
        evidenceRefIds: [],
        source: 'shell'
      });
    }

    return {
      title: mapDomainToTitle(d),
      iconName: mapDomainToIcon(d),
      score: output.score.value,
      textValue: output.score.stateLabel,
      paragraph1: mainInsight?.summary || 'Análise funcional ativa.',
      paragraph2: mainInsight?.explanation || 'Factores de disponibilidade metabólica em monitorização.',
      refText1: `Baseado em ${output.inputSummary.signalsCount} sinais biológicos normalizados.`,
      refText2: `Audit Trace: ${output.inputSummary.trace.join(', ')}`,
      suggestions: visibleRecs.map(r => ({ title: r.title, desc: r.bodyShort })),
      domain: d
    };
  });
}

function mapDomainToTitle(domain: string): string {
  const map: any = { 
    general: 'Visão Holística',
    performance: 'Performance & Equilíbrio', 
    energy: 'Energia & Disponibilidade', 
    recovery: 'Recuperação Muscular',
    sleep: 'Qualidade de Sono',
    nutrition: 'Monitorização Nutricional'
  };
  return map[domain] || domain;
}

function mapDomainToIcon(domain: string): any {
  const map: any = {
    general: 'Activity',
    performance: 'Activity',
    energy: 'Zap',
    recovery: 'Moon',
    sleep: 'Moon',
    nutrition: 'Heart'
  };
  return map[domain] || 'Activity';
}

function generateSingleDomainFallback(domain: string): UIInsight {
  return {
    title: mapDomainToTitle(domain),
    iconName: mapDomainToIcon(domain),
    paragraph1: "Monitorização em curso ou dados insuficientes.",
    paragraph2: "O sistema aguarda por mais leituras de sincronização para estabilizar este pilar de análise.",
    refText1: "Estado: Aguardando sincronização contínua.",
    refText2: "Aviso: Sem cobertura de sinais suficiente para análise.",
    suggestions: [],
    domain: domain as DomainType
  };
}

function generateFallbackInsights(): UIInsight[] {
  // Mock para desenvolvimento se o bundle for null
  return [];
}
