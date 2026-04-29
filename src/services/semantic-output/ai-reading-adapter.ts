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
  const highlightedThemes = Array.isArray(raw.highlightedThemes) ? raw.highlightedThemes : [];
  const priorityActions = Array.isArray(raw.priorityActions) ? raw.priorityActions : [];
  const watchSignals = Array.isArray(raw.watchSignals) ? raw.watchSignals : [];

  return {
    summary: {
      title: summary.title || 'Análise de dados concluída',
      text: summary.text || 'Ocorreu um erro ao gerar o resumo detalhado desta leitura. Pode visualizar as dimensões abaixo.',
      confidence: mapConfidence(summary.confidence),
      mode: 'real', // Pode ser sobrescrito pelo caller se for demo
    },
    dimensions: dimensions.map((d: any) => ({
      id: d.id || 'unknown',
      label: d.label || 'Domínio Desconhecido',
      score: typeof d.score === 'number' ? d.score : 0,
      explanation: d.explanation || '',
      supportingFacts: Array.isArray(d.supportingFacts) ? d.supportingFacts : [],
      confidence: mapConfidence(d.confidence),
    })),
    highlightedThemes: highlightedThemes.slice(0, 5).map((t: any) => ({
      id: t.id || 'theme',
      title: t.title || 'Tema em destaque',
      status: mapStatus(t.status),
      explanation: t.explanation || '',
      supportingFacts: Array.isArray(t.supportingFacts) ? t.supportingFacts : [],
      action: typeof t.suggestedAction === 'string' && t.suggestedAction !== '' ? t.suggestedAction : undefined,
      confidence: mapConfidence(t.confidence),
      limitation: Array.isArray(t.limitations) && t.limitations.length > 0 ? t.limitations[0] : undefined,
    })),
    priorityActions: priorityActions.slice(0, 3).map((a: any) => ({
      title: a.title || 'Ação sugerida',
      reason: a.reason || 'Sinalização importante',
      priority: mapPriority(a.priority),
      supportingFacts: Array.isArray(a.supportingFacts) ? a.supportingFacts : [],
      domain: a.domain || 'general',
      evidenceStrength: mapConfidence(a.confidence), // mapped to 0-1 if frontend expects number
    })),
    watchSignals: watchSignals.map((s: any) => ({
      title: s.title || 'Sinal a monitorizar',
      explanation: s.explanation || '',
      reasonToRepeat: s.reasonToRepeat || 'Reavaliação necessária',
    })),
    references: {
      usedDataFamilies: Array.isArray(references.usedDataFamilies) ? references.usedDataFamilies : [],
      usedSignals: Array.isArray(references.usedSignals) ? references.usedSignals : [],
      freshness: mapFreshness(references.freshness),
      origins: ['AI Generated'],
      confidence: mapConfidenceString(references.confidence),
      limitations: Array.isArray(references.limitations) ? references.limitations : [],
      themeDataLinks: {}, // Ignorado ou mapeado do AI se suportado
    },
    readingLimits: Array.isArray(raw.readingLimits) ? raw.readingLimits : [
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
