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
  const activeDomains = ['sleep', 'nutrition', 'general'];
  
  return activeDomains.map(d => {
    const output = bundle.domains[d];
    
    // ── FALLBACK DETERMINÍSTICO (PT-PT) ──
    if (!output || output.status === 'unavailable' || output.status === 'insufficient_data') {
      return {
        domain: d as any,
        title: mapDomainToTitle(d),
        iconName: mapDomainToIcon(d),
        score: output?.score || 0,
        status: output?.status || 'unavailable',
        isStale: !!output?.isStale,
        paragraph1: output?.statusLabel || 'Sincronização em Curso',
        paragraph2: 'Aguardando massa crítica de dados biográficos para interpretação.',
        refText1: 'Estabilidade',
        refText2: 'Baixa',
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
        paragraph1: 'Revalidação Necessária',
        paragraph2: 'Aguardando novos sinais biográficos para atualizar este domínio.',
        refText1: 'Estado',
        refText2: 'Pendente',
        suggestions: []
      };
    }

    const { status, statusLabel, score, mainInsight, recommendations } = output;

    return {
      domain: d as any,
      title: mapDomainToTitle(d),
      iconName: mapDomainToIcon(d),
      score,
      status,
      isStale: false,
      paragraph1: mainInsight?.summary || statusLabel || 'Tendência Estável',
      paragraph2: mainInsight?.description || 'Os seus sinais biográficos indicam um rastro consistente.',
      refText1: 'Integridade',
      refText2: 'Verificada',
      suggestions: (recommendations || []).map(r => ({
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
    general: 'Ablute Wellness'
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
    general: 'User'
  };
  return icons[domain] || 'Activity';
}
