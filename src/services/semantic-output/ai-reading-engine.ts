import { SemanticStatus, SemanticDomainView, SemanticRecommendationView, SemanticInsightView } from './types';
import { AnalysisMeasurement, AnalysisEvent } from '../../store/types';

// ── HOLISTIC DIMENSION TYPES (R5A) ──────────────────────────────────────────

export type DimensionDriver = {
  label: string;
  value?: string | number;
  unit?: string;
  direction: 'positive' | 'negative' | 'neutral';
  impact: 'low' | 'medium' | 'high';
  explanation: string;
};

export type DimensionRecommendation = {
  text: string;
  reason: string;
  type: 'hydration' | 'food' | 'routine' | 'monitoring' | 'recovery' | 'context';
  priority: 'low' | 'medium' | 'high';
};

export type DimensionReference = {
  factor: string;
  observedValue?: string;
  whyItMatters: string;
  influenceOnScore: string;
  caution?: string;
};

export type HolisticDimension = {
  id: string;
  title: string;
  internalTechnicalIds?: string[];
  color: string;
  score: number | null;
  confidence: 'low' | 'medium' | 'high' | 'insufficient';
  status: 'stable' | 'watch' | 'priority' | 'insufficient';
  summary: string;
  topDrivers: DimensionDriver[];
  recommendations: DimensionRecommendation[];
  references: DimensionReference[];
  limitations: string[];
};

export interface AIReading {
  summary: {
    title: string;
    text: string;
    confidence: number;
    mode: 'simulation' | 'real';
  };
  dimensions: HolisticDimension[]; // Substitui o formato antigo
  nextFocus?: {
    dimensionId: string;
    label: string;
    color: string;
  };
  // Campos de compatibilidade legada se existirem:
  priorityActions?: any[];
  highlightedThemes?: any[];
  watchSignals?: any[];
  references?: any;
  readingLimits?: string[];
}

export type AiReadingLLMContextV2 = {
  sourceOrigin: string;
  isDemo: boolean;
  analysisDate: string;
  activeObjectives: string[];
  visibleDimensions: HolisticDimension[];
  internalScores: Record<string, number | null>;
  topGlobalDrivers: DimensionDriver[];
  dataQuality: string;
  missingData: string[];
  historySummary: string;
  safetyRules: string[];
  language: 'pt-PT';
  nextFocus?: { dimensionId: string; label: string; color: string; };
  attentionDimension?: string;
  auraColor?: string;
  cached?: boolean;
  promptVersion?: string;
  contractVersion?: string;
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function score01(v: number, inMin: number, inMax: number) { return clamp(((v - inMin) / (inMax - inMin)) * 100, 0, 100); }

function getMeasurement(ms: AnalysisMeasurement[], type: string, marker?: string): string {
  const val = ms.find(m => m.type === type && (!marker || m.marker === marker))?.value;
  return val !== undefined && val !== null ? String(val) : '';
}

function getSleepHours(facts: AnalysisEvent[]): number {
  const f = facts.find(f => f.type === 'sleep_duration_logged' || f.type === 'sono_profundo' || f.type === 'Sono');
  if (!f) return 0;
  const raw = String(f.value ?? '');
  const match = String(raw).match(/(\d+)h\s*(\d+)?/);
  if (!match) return 0;
  return parseInt(match[1]) + (parseInt(match[2] || '0') / 60);
}

// ── NEW MOTOR DE CÁLCULO HOLÍSTICO (R5A) ──────────────────────────────────────

export function computeAIReadingFromData(
  measurements: AnalysisMeasurement[],
  ecosystemFacts: AnalysisEvent[],
  isDemo: boolean
): AIReading {
  // --- 1. Extração de Biomarcadores ---
  const hr = parseFloat(getMeasurement(measurements, 'ecg', 'Frequência cardíaca') || getMeasurement(measurements, 'ecg', 'Ritmo Cardíaco') || '0');
  const hrvStr = getMeasurement(measurements, 'ppg', 'HRV Estimada');
  const recFact = ecosystemFacts.find(f => f.type === 'Recuperação');
  const hrv = parseFloat(hrvStr || (recFact ? String(recFact.value) : '0'));
  
  const temp = parseFloat(getMeasurement(measurements, 'temp', 'Temperatura') || '0');
  const spo2 = parseFloat(getMeasurement(measurements, 'ppg', 'SpO2') || getMeasurement(measurements, 'ppg', 'Saturação de oxigénio') || '0');
  
  const gravidade = parseFloat(getMeasurement(measurements, 'urinalysis', 'Densidade Urinária') || getMeasurement(measurements, 'urinalysis', 'Gravidade Específica') || '0');
  const na = parseFloat(getMeasurement(measurements, 'urinalysis', 'Sódio Urinário') || '0');
  const k = parseFloat(getMeasurement(measurements, 'urinalysis', 'Potássio Urinário') || '0');
  const nakRatio = parseFloat(getMeasurement(measurements, 'urinalysis', 'Rácio Na/K') || '0');
  const creatinina = parseFloat(getMeasurement(measurements, 'urinalysis', 'Creatinina Urinária') || '0');
  const ph = parseFloat(getMeasurement(measurements, 'urinalysis', 'pH Urinário') || '0');
  const glicose = getMeasurement(measurements, 'urinalysis', 'Glicose') === 'Positivo' ? 1 : (getMeasurement(measurements, 'urinalysis', 'Glicose') === 'Negativo' ? 0 : -1);
  const nitritos = getMeasurement(measurements, 'urinalysis', 'Nitritos') === 'Positivo' ? 1 : (getMeasurement(measurements, 'urinalysis', 'Nitritos') === 'Negativo' ? 0 : -1);
  const uACR = parseFloat(getMeasurement(measurements, 'urinalysis', 'Albumina / uACR') || '0');
  
  const bristol = getMeasurement(measurements, 'fecal', 'Bristol');
  const fecalOptic = getMeasurement(measurements, 'fecal', 'Caracterização Óptica') || '';
  const sleepH = getSleepHours(ecosystemFacts);
  
  const f2iso = parseFloat(getMeasurement(measurements, 'oxidative', 'F2-isoprostanos') || '0');
  const ngal = parseFloat(getMeasurement(measurements, 'kidney', 'NGAL') || '0');
  const kim1 = parseFloat(getMeasurement(measurements, 'kidney', 'KIM-1') || '0');
  const cistatina = parseFloat(getMeasurement(measurements, 'kidney', 'Cistatina C Urinária') || '0');

  // --- 2. Função Base de Weighted Score ---
  function computeDimensionScore(factors: { val: number | string; weight: number; evaluate: (v: any) => number }[]) {
    let weightSum = 0;
    let scoreSum = 0;
    factors.forEach(f => {
      if (f.val !== '0' && f.val !== 0 && f.val !== -1 && f.val !== '') {
        const itemScore = f.evaluate(f.val);
        scoreSum += itemScore * f.weight;
        weightSum += f.weight;
      }
    });
    if (weightSum === 0) return { score: null, confidence: 'insufficient' as const };
    const finalScore = Math.round(scoreSum / weightSum);
    const maxWeight = factors.reduce((acc, f) => acc + f.weight, 0);
    const ratio = weightSum / maxWeight;
    
    let confidence: 'high' | 'medium' | 'low' | 'insufficient' = 'low';
    if (ratio >= 0.7) confidence = 'high';
    else if (ratio >= 0.4) confidence = 'medium';
    else if (ratio >= 0.2) confidence = 'low';
    else confidence = 'insufficient';
    
    return { score: finalScore, confidence };
  }

  // Helper para Bristol (1-7) -> score 0-100 (3-4 é bom, extremos são maus)
  const evalBristol = (v: any) => {
    const num = parseInt(v.toString().replace(/\D/g, ''));
    if (num === 3 || num === 4) return 100;
    if (num === 2 || num === 5) return 60;
    return 20; // 1, 6, 7
  };

  // --- 3. Calcular Dimensões ---

  // D2. Recuperação & Carga
  const recScore = computeDimensionScore([
    { val: f2iso, weight: 25, evaluate: v => score01(v, 2.5, 0.5) }, // Baixo é bom
    { val: hr, weight: 20, evaluate: v => (v >= 50 && v <= 75 ? 100 : score01(v, 100, 75)) },
    { val: temp, weight: 15, evaluate: v => (v >= 36.1 && v <= 37.2 ? 100 : score01(v, 38, 37.2)) },
    { val: ngal, weight: 10, evaluate: v => score01(v, 30, 10) },
    { val: sleepH, weight: 10, evaluate: v => score01(v, 4, 8) }
  ]);

  // D3. Equilíbrio Interno
  const eqScore = computeDimensionScore([
    { val: gravidade, weight: 30, evaluate: v => score01(v, 1.030, 1.010) },
    { val: nakRatio, weight: 20, evaluate: v => score01(v, 3.5, 1.0) },
    { val: na, weight: 15, evaluate: v => score01(v, 150, 70) },
    { val: creatinina, weight: 10, evaluate: v => score01(v, 250, 80) },
    { val: bristol, weight: 10, evaluate: evalBristol },
    { val: ph, weight: 5, evaluate: v => (v >= 5.5 && v <= 7.5 ? 100 : 50) }
  ]);

  // D4. Ritmo Metabólico
  const metScore = computeDimensionScore([
    { val: glicose === 1 ? 1 : 0, weight: 20, evaluate: v => v === 1 ? 20 : 100 },
    { val: ph, weight: 10, evaluate: v => (v >= 5.5 && v <= 7.5 ? 100 : 50) },
    { val: nakRatio, weight: 15, evaluate: v => score01(v, 3.5, 1.0) },
    { val: bristol, weight: 10, evaluate: evalBristol },
    { val: sleepH, weight: 10, evaluate: v => score01(v, 4, 8) }
  ]);

  // D5. Conforto Digestivo
  const digScore = computeDimensionScore([
    { val: bristol, weight: 40, evaluate: evalBristol },
    { val: fecalOptic ? 1 : 0, weight: 20, evaluate: v => v === 1 && !fecalOptic.includes('seca') ? 100 : 50 }
  ]);

  // D6. Ajustes Alimentares
  const nutScore = computeDimensionScore([
    { val: nakRatio, weight: 25, evaluate: v => score01(v, 3.5, 1.0) },
    { val: bristol, weight: 20, evaluate: evalBristol },
    { val: gravidade, weight: 10, evaluate: v => score01(v, 1.030, 1.010) },
    { val: glicose === 1 ? 1 : 0, weight: 10, evaluate: v => v === 1 ? 20 : 100 }
  ]);

  // D7. Sinais de Rotina
  const rotScore = computeDimensionScore([
    { val: uACR, weight: 25, evaluate: v => score01(v, 30, 5) },
    { val: creatinina, weight: 10, evaluate: v => score01(v, 250, 80) },
    { val: cistatina, weight: 12, evaluate: v => score01(v, 0.15, 0.05) },
    { val: ngal, weight: 12, evaluate: v => score01(v, 30, 10) },
    { val: kim1, weight: 12, evaluate: v => score01(v, 1.5, 0.5) },
    { val: nitritos === 1 ? 1 : 0, weight: 10, evaluate: v => v === 1 ? 20 : 100 }
  ]);

  // D1. Prontidão de Hoje (Agregador)
  const readyScore = computeDimensionScore([
    { val: hr ? 1 : 0, weight: 25, evaluate: () => hr >= 50 && hr <= 80 ? 100 : 60 },
    { val: recScore.score || 0, weight: 25, evaluate: v => v },
    { val: eqScore.score || 0, weight: 20, evaluate: v => v },
    { val: digScore.score || 0, weight: 10, evaluate: v => v },
    { val: metScore.score || 0, weight: 10, evaluate: v => v }
  ]);

  // Helper para Status
  const getStatus = (score: number | null): HolisticDimension['status'] => {
    if (score === null) return 'insufficient';
    if (score >= 70) return 'stable';
    if (score >= 40) return 'watch';
    return 'priority';
  };

  const genHolistic = (id: string, title: string, color: string, scoreRes: {score: number|null, confidence: any}, summaries: {good:string, warn:string}): HolisticDimension => ({
    id, title, color,
    score: scoreRes.score,
    confidence: scoreRes.confidence,
    status: getStatus(scoreRes.score),
    summary: scoreRes.score === null ? 'Dados insuficientes para avaliar.' : (scoreRes.score >= 60 ? summaries.good : summaries.warn),
    topDrivers: [],
    recommendations: [],
    references: [],
    limitations: isDemo ? ['demo_data_not_for_real_longitudinal_use'] : []
  });

  const dimensions: HolisticDimension[] = [
    genHolistic('readiness_today', 'Prontidão de hoje', '#38BDF8', readyScore, {
      good: 'Sinais gerais sugerem um corpo num estado favorável para funcionar bem, com base na recuperação e estabilidade.',
      warn: 'A leitura sugere necessidade de repouso ou melhor regulação, possivelmente devido a carga fisiológica ou contexto de stress.'
    }),
    genHolistic('recovery_load', 'Recuperação & carga', '#6366F1', recScore, {
      good: 'A resposta fisiológica sugere que o corpo parece estar a recuperar bem face à carga recente.',
      warn: 'Os dados apontam para sinais de carga ou esforço. Priorizar descanso antes de aumentar a intensidade.'
    }),
    genHolistic('internal_balance', 'Equilíbrio interno', '#14B8A6', eqScore, {
      good: 'O equilíbrio de fluidos e minerais parece estável e funcional nesta sessão.',
      warn: 'Leitura sugere maior concentração urinária ou desequilíbrio no perfil fluido-mineral.'
    }),
    genHolistic('metabolic_rhythm', 'Ritmo metabólico', '#22C55E', metScore, {
      good: 'Os sinais disponíveis apoiam energia estável e um contexto metabólico regular.',
      warn: 'Há sinais que justificam pequenos ajustes na rotina alimentar ou hidratação para manter o ritmo.'
    }),
    genHolistic('digestive_comfort', 'Conforto digestivo', '#D97706', digScore, {
      good: 'O trânsito e conforto intestinal parecem equilibrados, favorecendo absorção regular.',
      warn: 'Os sinais sugerem um desvio do padrão ótimo intestinal, possivelmente indicando necessidade de hidratação e fibra.'
    }),
    genHolistic('food_adjustments', 'Ajustes alimentares', '#F59E0B', nutScore, {
      good: 'Os biomarcadores suportam a atual rotina alimentar. Manter consistência.',
      warn: 'Os dados apontam para possível benefício em ajustar a ingestão de certos minerais ou líquidos.'
    }),
    genHolistic('routine_signals', 'Sinais de rotina', '#8B5CF6', rotScore, {
      good: 'Não existem marcadores fora do padrão que exijam acompanhamento atípico.',
      warn: 'Há marcadores a observar. Estes sinais isolados não indicam alarme clínico, mas merecem atenção nas próximas leituras.'
    })
  ];

  // Adicionar Drivers & Recomendações
  // Exemplo para Internal Balance
  const eqDim = dimensions.find(d => d.id === 'internal_balance');
  if (eqDim && eqScore.score !== null) {
    if (gravidade > 1.025) {
      eqDim.topDrivers.push({ label: 'Densidade Urinária', value: gravidade, direction: 'negative', impact: 'high', explanation: 'Sugere urina mais concentrada.' });
      eqDim.recommendations.push({ text: 'Distribuir água ao longo do dia.', reason: 'Urina concentrada.', type: 'hydration', priority: 'high' });
      eqDim.references.push({ factor: 'Densidade Urinária', observedValue: String(gravidade), whyItMatters: 'Ajuda a avaliar hidratação.', influenceOnScore: 'Reduziu o score.' });
    } else {
      eqDim.topDrivers.push({ label: 'Densidade Urinária', value: gravidade, direction: 'positive', impact: 'high', explanation: 'Estável.' });
    }
  }

  // Determinar Próximo Foco
  let nextFocusDimension: HolisticDimension | null = null;
  let lowestScore = 101;
  for (const d of dimensions) {
    if (d.score !== null && d.confidence !== 'insufficient' && d.score < lowestScore) {
      lowestScore = d.score;
      nextFocusDimension = d;
    }
  }

  const nextFocus = nextFocusDimension ? {
    dimensionId: nextFocusDimension.id,
    label: nextFocusDimension.title,
    color: nextFocusDimension.color
  } : undefined;

  // Add Próximo Foco as 8th dimension
  dimensions.push({
    id: 'next_focus',
    title: 'Próximo foco',
    color: nextFocus ? nextFocus.color : '#AAA',
    score: null,
    confidence: 'high',
    status: 'stable',
    summary: nextFocus ? `O ajuste mais útil a fazer primeiro foca-se em: ${nextFocus.label}.` : 'Manter consistência geral.',
    topDrivers: [],
    recommendations: [],
    references: [],
    limitations: []
  });

  return {
    summary: { 
      title: nextFocusDimension && nextFocusDimension.score! < 60 ? `Atenção: ${nextFocusDimension.title}` : 'Sinais coerentes entre categorias', 
      text: 'Resumo holístico.', 
      confidence: 0.85, 
      mode: isDemo ? 'simulation' : 'real' 
    },
    dimensions,
    nextFocus
  };
}

export function buildAiReadingLLMContextV2(reading: AIReading, isDemo: boolean): AiReadingLLMContextV2 {
  return {
    sourceOrigin: isDemo ? 'demo' : 'real',
    isDemo,
    analysisDate: new Date().toISOString(),
    activeObjectives: [],
    visibleDimensions: reading.dimensions,
    internalScores: reading.dimensions.reduce((acc, d) => ({ ...acc, [d.id]: d.score }), {}),
    topGlobalDrivers: [],
    dataQuality: 'medium',
    missingData: [],
    historySummary: '',
    safetyRules: ['No clinical diagnosis', 'Use Portuguese', 'No medical supplement claims as first-line'],
    language: 'pt-PT',
    nextFocus: reading.nextFocus,
    attentionDimension: reading.nextFocus?.dimensionId,
    auraColor: reading.nextFocus?.color,
    cached: false,
    promptVersion: '2.0.0',
    contractVersion: '2.0.0'
  };
}
