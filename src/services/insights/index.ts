/**
 * INSIGHTS SERVICE v1.2.0
 * Pure UI Adapter for Semantic Output (PT-PT)
 * Operacional: Partial Bundle & Stale alignment
 */

import { semanticOutputService } from '../semantic-output';
import { SemanticStatus, SemanticOutputStatus } from '../semantic-output/types';

export interface UIInsight {
  title: string;
  iconName?: 'Activity' | 'Zap' | 'Target' | 'Heart' | 'Moon' | 'Brain' | 'User';
  score?: number;
  status: SemanticStatus;
  isStale?: boolean; // Sinalizador biográfico
  band?: 'good' | 'fair' | 'poor' | string;
  
  // UI Presentation Fields
  paragraph1: string;
  paragraph2: string;
  refText1: string;
  refText2: string;
  suggestions?: { title: string; desc: string }[];
  domain: string;
}

/**
 * Obter estado formal do carregamento/refresh semântico.
 */
export function getSemanticStatus(): SemanticOutputStatus {
  return semanticOutputService.getStatus();
}

/**
 * Obter estado da IA Gateway (v1.3.0)
 */
export function getAiStatus() {
  const state = semanticOutputService.getState();
  return {
    status: state.aiStatus,
    error: state.aiError,
    meta: state.aiMeta
  };
}

/**
 * Obter insights formatados para a Shell a partir do Semantic Bundle (PT-PT).
 * Ponto único de verdade para a UI com suporte a Stale e Enriquecimento IA.
 */
export function getSemanticInsights(): UIInsight[] {
  const state = semanticOutputService.getState();
  const bundle = semanticOutputService.getBundle();
  const activeDomains = Object.keys(bundle?.domains || {});
  
  const aiInsight = state.aiStatus === 'ready' ? state.aiInsight : null;

  return activeDomains.map(d => {
    const output = semanticOutputService.getDomainOutput(d);
    
    // ── FALLBACK DETERMINÍSTICO (PT-PT) ──
    if (!output || output.status === 'error') {
      return {
        domain: d as any,
        title: mapDomainToTitle(d),
        iconName: mapDomainToIcon(d),
        score: output?.score || 0,
        status: 'error' as any,
        isStale: !!output?.isStale,
        paragraph1: 'Não foi possível atualizar esta leitura',
        paragraph2: 'O recálculo diário não conseguiu completar-se com sucesso.',
        refText1: 'Estado',
        refText2: 'Sem Dados',
        suggestions: []
      };
    }

    if (output.status === 'unavailable') {
      return {
        domain: d as any,
        title: mapDomainToTitle(d),
        iconName: mapDomainToIcon(d),
        score: output?.score || 0,
        status: 'unavailable',
        isStale: !!output?.isStale,
        paragraph1: 'Ainda sem dados suficientes',
        paragraph2: 'Sincronize uma app aderente para iniciar a interpretação.',
        refText1: 'Estado',
        refText2: 'Sem Dados',
        suggestions: []
      };
    }

    if (output.status === 'insufficient_data') {
      return {
        domain: d as any,
        title: mapDomainToTitle(d),
        iconName: mapDomainToIcon(d),
        score: output?.score || 0,
        status: 'insufficient_data',
        isStale: !!output?.isStale,
        paragraph1: 'Faltam mais registos',
        paragraph2: 'Temos alguns registos, porém precisamos de mais consistência.',
        refText1: 'Métricas',
        refText2: 'A Processar',
        suggestions: []
      };
    }

    // ── SUPORTE A REVALIDAÇÃO PENDENTE (STALE) ──
    if (output.status === 'stale' || output.isStale) {
      return {
        domain: d as any,
        title: mapDomainToTitle(d),
        iconName: mapDomainToIcon(d),
        score: output.score || 0,
        status: 'stale',
        isStale: true,
        paragraph1: 'Dados desatualizados',
        paragraph2: 'Os indicadores estão a perder validade. Refresque a sua última medição.',
        refText1: 'Estado',
        refText2: 'Desatualizado',
        suggestions: []
      };
    }

    const { status, statusLabel, score, band, mainInsight, recommendations } = output;

    // ── ENRIQUECIMENTO COM BACKEND IA (v1.3.0) ──
    let p1 = mainInsight?.summary || statusLabel || 'Estabilidade Detetada';
    let p2 = mainInsight?.description || 'Os seus registos apontam para equilíbrio nesta área.';
    let sugs = (recommendations || []).map((r: any) => ({ title: r.title, desc: r.actionable }));

    if (aiInsight) {
      // Mapeamento explícito de domínios Backend -> Frontend
      if (d === 'energy' && aiInsight.domains?.energia_disponibilidade) {
        p2 = aiInsight.domains.energia_disponibilidade;
      } else if (d === 'recovery' && aiInsight.domains?.recuperacao_resiliencia) {
        p2 = aiInsight.domains.recuperacao_resiliencia;
      } else if (d === 'nutrition' && aiInsight.domains?.digestao_trato_intestinal) {
        p2 = aiInsight.domains.digestao_trato_intestinal;
      } else if (d === 'general') {
        // FOCO PRINCIPAL: Usa headline + summary globais da IA
        p1 = aiInsight.headline || p1;
        p2 = aiInsight.summary || p2;
        // Injetar sugestões do backend se for o card geral
        if (aiInsight.suggestions && aiInsight.suggestions.length > 0) {
          sugs = aiInsight.suggestions.map(s => ({ title: 'Sugestão IA', desc: s }));
        }
      }
    }

    return {
      domain: d as any,
      title: mapDomainToTitle(d),
      iconName: mapDomainToIcon(d),
      score,
      band,
      status: status as any,
      isStale: false,
      paragraph1: p1,
      paragraph2: p2,
      refText1: aiInsight ? 'Análise IA' : 'Sinais base',
      refText2: aiInsight ? 'Enriquecida' : 'Analisados',
      suggestions: sugs
    };
  });
}

/**
 * Mapeamento biográfico de títulos em PT-PT.
 */
function mapDomainToTitle(domain: string): string {
  const titles: Record<string, string> = {
    sleep: 'Qualidade do Sono',
    nutrition: 'Equilíbrio Metabólico',
    general: 'Ablute Wellness',
    energy: 'Energia Biológica',
    recovery: 'Capacidade de Recuperação',
    performance: 'Capacidade de Desempenho'
  };
  return titles[domain] || domain;
}

/**
 * Mapeamento visual de ícones.
 */
function mapDomainToIcon(domain: string): any {
  const icons: Record<string, string> = {
    sleep: 'Moon',
    nutrition: 'Zap',
    general: 'User',
    energy: 'Activity',
    recovery: 'Heart',
    performance: 'Target'
  };
  return icons[domain] || 'Activity';
}
