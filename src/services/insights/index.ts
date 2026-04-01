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
  domain: 'sleep' | 'nutrition' | 'general' | 'performance' | 'energy' | 'recovery';
}

/**
 * Obter estado formal do carregamento/refresh semântico.
 */
export function getSemanticStatus(): SemanticOutputStatus {
  return semanticOutputService.getStatus();
}

/**
 * Obter insights formatados para a Shell a partir do Semantic Bundle (PT-PT).
 * Ponto único de verdade para a UI com suporte a Stale.
 */
export function getSemanticInsights(): UIInsight[] {
  const bundle = semanticOutputService.getBundle();
  const activeDomains = ['sleep', 'nutrition', 'general', 'energy', 'recovery', 'performance'];
  
  return activeDomains.map(d => {
    // Usamos getDomainOutput em vez de aceder direto no bundle para garantir que 
    // os Guardrails de Fidelity (anti-falta de insights reais em ready) são despoletados.
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
        paragraph2: 'O recálculo diário não conseguiu completar-se com sucesso. Pode haver uma falha temporária.',
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
        paragraph2: 'Para ter acesso a esta interpretação, sincronize uma app aderente ou inicie os primeiros passos.',
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
        paragraph2: 'Temos alguns registos, porém precisamos de mais consistência para fechar o padrão.',
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
        paragraph2: 'Os indicadores que possuímos estão a perder a validade. Refresque a sua última medição.',
        refText1: 'Estado',
        refText2: 'Desatualizado',
        suggestions: []
      };
    }

    const { status, statusLabel, score, band, mainInsight, recommendations } = output;

    return {
      domain: d as any,
      title: mapDomainToTitle(d),
      iconName: mapDomainToIcon(d),
      score,
      band,
      status: status as any,
      isStale: false,
      paragraph1: mainInsight?.summary || statusLabel || 'Tudo Regular',
      paragraph2: mainInsight?.description || 'Os seus registos apontam para estabilidade nesta área.',
      refText1: 'Sinais base',
      refText2: 'Analisados',
      suggestions: (recommendations || []).map((r: any) => ({
        title: r.title,
        desc: r.actionable
      }))
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
