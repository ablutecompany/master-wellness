import { AIReading } from './ai-reading-engine';

/**
 * Normalizes the raw JSON response from the AI Gateway into the canonical AIReading frontend interface.
 * Handles fallback, array limits, and missing fields to ensure the UI never crashes.
 */
export function normalizeAIReadingResponse(rawOutput: any): AIReading {
  const isObject = (val: any) => typeof val === 'object' && val !== null;

  const raw = isObject(rawOutput) ? rawOutput : {};

  // Fallbacks para objetos base
  const summary = isObject(raw.summary) ? raw.summary : {};
  const references = isObject(raw.references) ? raw.references : {};

  const dimensions = Array.isArray(raw.dimensions) ? raw.dimensions : [];
  const globalReferences = isObject(raw.globalReferences) ? raw.globalReferences : {};

  return {
    summary: {
      title: summary.title || 'Análise de dados concluída',
      text: summary.text || 'Ocorreu um erro ao gerar o resumo detalhado desta leitura. Pode visualizar as dimensões abaixo.',
      confidence: mapConfidence(summary.confidence?.score),
      mode: 'real', // Pode ser sobrescrito pelo caller se for demo
    },
    dimensions: dimensions.map((d: any) => ({
      id: d.id || 'unknown',
      label: d.shortLabel || d.label || 'Domínio Desconhecido', // We want to show short labels on the grid if possible
      score: typeof d.score === 'number' ? d.score : 50,
      explanation: d.messageText || d.explanation || '',
      groundingReasoning: d.grounding?.reasoning || '',
      supportingFacts: d.grounding?.usedFamilies || [],
      confidence: mapConfidence(d.grounding?.confidenceScore),
    })),
    highlightedThemes: dimensions.map((d: any) => ({
      id: d.id || 'theme',
      title: d.messageTitle || d.label || 'Tema em destaque',
      status: mapStatus(d.status),
      explanation: d.messageText || '',
      supportingFacts: d.grounding?.usedFamilies || [],
      action: typeof d.primaryRecommendation === 'string' && d.primaryRecommendation !== '' ? d.primaryRecommendation : undefined,
      confidence: mapConfidence(d.grounding?.confidenceScore),
      limitation: Array.isArray(d.grounding?.limitations) && d.grounding.limitations.length > 0 ? d.grounding.limitations[0] : undefined,
    })),
    priorityActions: dimensions.flatMap((d: any) => 
      Array.isArray(d.recommendations) ? d.recommendations.map((r: any) => ({
        title: r.title || 'Ação sugerida',
        reason: r.text || 'Sinalização importante',
        priority: mapPriority(r.priority),
        supportingFacts: [],
        domain: d.id || 'general',
        evidenceStrength: mapConfidence(d.grounding?.confidenceScore),
      })) : []
    ).slice(0, 3), // max 3 actions globally
    watchSignals: dimensions.filter((d: any) => d.id === 'watch_signals').map((s: any) => ({
      title: s.messageTitle || 'Sinal a monitorizar',
      explanation: s.messageText || '',
      reasonToRepeat: s.primaryRecommendation || 'Reavaliação necessária',
    })),
    references: {
      usedDataFamilies: Array.isArray(globalReferences.usedDataFamilies) ? globalReferences.usedDataFamilies : [],
      usedSignals: dimensions.flatMap((d: any) => Array.isArray(d.grounding?.usedSignals) ? d.grounding.usedSignals.map((s:any) => s.label) : []),
      freshness: mapFreshness(globalReferences.freshness),
      origins: [globalReferences.origin || 'AI Generated'],
      confidence: mapConfidenceString(summary.confidence?.label),
      limitations: Array.isArray(globalReferences.limitations) ? globalReferences.limitations : [],
      themeDataLinks: dimensions.reduce((acc: any, d: any) => {
        if (d.id) {
          acc[d.id] = Array.isArray(d.grounding?.usedSignals) ? d.grounding.usedSignals.map((s:any) => s.label) : [];
        }
        return acc;
      }, {}),
    },
    readingLimits: [
      'Esta leitura é interpretativa e gerada por inteligência artificial.',
      'Não substitui avaliação clínica nem faz diagnóstico.'
    ]
  };
}

// ── Helpers de mapeamento seguro ──

function mapConfidence(val: any): number {
  if (typeof val === 'number') return val;
  if (val === 'high') return 0.9;
  if (val === 'medium') return 0.6;
  if (val === 'low') return 0.3;
  return 0.5;
}

function mapConfidenceString(val: any): 'high' | 'medium' | 'low' {
  if (val === 'high' || val === 'medium' || val === 'low') return val;
  return 'medium';
}

function mapStatus(val: any): 'optimal' | 'caution' | 'insufficient' {
  if (val === 'stable' || val === 'optimal') return 'optimal';
  if (val === 'attention' || val === 'caution') return 'caution';
  return 'insufficient';
}

function mapPriority(val: any): 'low' | 'medium' | 'high' {
  if (val === 'low' || val === 'medium' || val === 'high') return val;
  return 'medium';
}

function mapFreshness(val: any): 'recent' | 'caution' | 'stale' | 'unavailable' {
  if (val === 'fresh' || val === 'recent') return 'recent';
  if (val === 'usable_with_warning') return 'caution';
  if (val === 'stale' || val === 'unavailable') return val;
  return 'unavailable';
}
